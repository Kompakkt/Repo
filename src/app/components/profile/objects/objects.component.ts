import { Component, computed, ElementRef, Input, OnInit, QueryList, signal, ViewChildren } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { firstValueFrom } from 'rxjs';


import { MatIconButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import {
  MatExpansionPanel,
  MatExpansionPanelContent,
  MatExpansionPanelDescription,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle,
} from '@angular/material/expansion';
import { MatFormField } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatPaginator, PageEvent} from '@angular/material/paginator';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
import { MatTooltip } from '@angular/material/tooltip';

import { ICompilation, IEntity, IUserData, isCompilation, isMetadataEntity } from '../../../../common';
import { TranslatePipe } from "../../../pipes/translate.pipe";
import { GridElementComponent } from "../../grid-element/grid-element.component";
import { AccountService, BackendService, DialogHelperService, QuickAddService } from '../../../services';
import { EntityRightsDialogComponent, EntitySettingsDialogComponent, VisibilityAndAccessDialogComponent } from '../../../dialogs';
import { AddEntityWizardComponent } from '../../../wizards';
import { SelectionService } from 'src/app/services/selection.service';
import { SelectionBox } from "../../selection-box/selection-box.component";

@Component({
  selector: 'app-objects',
  standalone: true,
  imports: [
    MatIconButton,
    MatExpansionPanel,
    MatExpansionPanelContent,
    MatExpansionPanelDescription,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    MatFormField,
    MatIcon,
    MatInput,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    MatPaginator,
    MatRadioButton,
    MatRadioGroup,
    MatTooltip,
    RouterLink,
    TranslatePipe,
    GridElementComponent,
    SelectionBox
],
  templateUrl: './objects.component.html',
  styleUrl: './objects.component.scss'
})
export class ObjectsComponent implements OnInit {
  @ViewChildren('gridItem', { read: ElementRef}) gridItems!: QueryList<ElementRef>;
  @Input() userData!: IUserData;
  public filteredEntitiesSignal = signal<IEntity []>([]);

  private publishedEntities = signal<IEntity[]>([]);
  private unpublishedEntities = signal<IEntity[]>([]);
  private restrictedEntities = signal<IEntity[]>([]);
  private unfinishedEntities = signal<IEntity[]>([]);

  public filter = signal({
    published: true,
    unpublished: false,
    restricted: false,
    unfinished: false,
  });

  public pageEvent: PageEvent = {
    previousPageIndex: 0,
    pageIndex: 0,
    pageSize: 20,
    length: Number.POSITIVE_INFINITY,
  };

  public searchInput = signal('');


  constructor(
    private account: AccountService,
    private dialog: MatDialog,
    private backend: BackendService,
    private helper: DialogHelperService,
    private quickAdd: QuickAddService,
    private selection: SelectionService
  ) {
  }

  async updateFilteredEntities() {
    this.publishedEntities.set(await firstValueFrom(this.account.publishedEntities$));
    this.unpublishedEntities.set(await firstValueFrom(this.account.unpublishedEntities$));
    this.restrictedEntities.set(await firstValueFrom(this.account.restrictedEntities$));
    this.unfinishedEntities.set(await firstValueFrom(this.account.unfinishedEntities$));  
  }

  filteredEntities = computed(() => {
    const { published, unpublished, restricted, unfinished } = this.filter();

    if (published) return this.publishedEntities();
    if (unpublished) return this.unpublishedEntities();
    if (restricted) return this.restrictedEntities();
    if (unfinished) return this.unfinishedEntities();
    return [];
  });

  userCompilations = computed(() => {
    return this.userData.data.compilation?.filter(comp => isCompilation(comp)) ?? [];
  });

  filteredLength = computed(() => this.paginatorEntities().length);

  paginatorEntities = computed(() => {
    const entities = this.filteredEntities();
    const searchInput = this.searchInput();
  
    const filtered = !searchInput ? entities : entities.filter(e => {
      let content = e.name;
      if (isMetadataEntity(e.relatedDigitalEntity)) {
        content += e.relatedDigitalEntity.title + e.relatedDigitalEntity.description;
      }
      return content.toLowerCase().includes(searchInput.toLowerCase());
    });
  
    const start = this.pageEvent.pageIndex * this.pageEvent.pageSize;
    const end = start + this.pageEvent.pageSize;
    return filtered.slice(start, end);
  });

  public async updateFilter(property?: string, paginator?: MatPaginator) {
    // On radio button change
    if (property) {
      this.clearSelection();
      // Disable wrong filters
      this.filter.update(f => ({
        published: property === 'published',
        unpublished: property === 'unpublished',
        restricted: property === 'restricted',
        unfinished: property === 'unfinished',
      }));
    }

    if (paginator) paginator.firstPage();
  }

  public changeEntitySearchText(event: Event, paginator: MatPaginator) {
    const value = (event.target as HTMLInputElement)?.value ?? '';
    this.searchInput.set(value.toLowerCase());
    paginator.firstPage();
  }

  public openEntitySettings(entity: IEntity) {
    const dialogRef = this.dialog.open(EntitySettingsDialogComponent, {
      data: entity,
      disableClose: true,
    });

    dialogRef
      .afterClosed()
      .toPromise()
      .then(result => {
        // Replace old entity with new entity
        if (result && this.userData && this.userData.data.entity) {
          const index = (this.userData.data.entity as IEntity[]).findIndex(
            _en => result._id === _en._id,
          );
          if (index === -1) return;
          this.userData.data.entity.splice(index, 1, result as IEntity);
          this.updateFilteredEntities();
        }
      });
  }

  public continueEntityUpload(entity: IEntity) {
    this.editEntity(entity);
  }

  public editViewerSettings(entity: IEntity) {
    this.helper.editSettingsInViewer(entity);
  }

  public openEntityOwnerSelection(entity: IEntity) {

    this.dialog.open(EntityRightsDialogComponent, {
      data: entity,
      disableClose: false,
    });

    this.updateFilteredEntities();
  }

  public openVisibilityAndAccess(entity: IEntity) {
    const dialogRef = this.dialog.open(VisibilityAndAccessDialogComponent, {
      data: entity,
      disableClose: true,
    });

    dialogRef
    .afterClosed()
    .toPromise()
    .then(result => {
      // Replace old entity with new entity
      if (result && this.userData && this.userData.data.entity) {
        const index = (this.userData.data.entity as IEntity[]).findIndex(
          _en => result._id === _en._id,
        );
        if (index === -1) return;
        this.userData.data.entity.splice(index, 1, result as IEntity);
        this.updateFilteredEntities();
      }
    });
  }

  public editEntity(entity: IEntity) {
    const dialogRef = this.dialog.open(AddEntityWizardComponent, {
      data: entity,
      disableClose: true,
    });

    dialogRef
      .afterClosed()
      .toPromise()
      .then(result => {
        if (result && this.userData && this.userData.data.entity) {
          const index = (this.userData.data.entity as IEntity[]).findIndex(
            _en => result._id === _en._id,
          );
          if (index === -1) return;
          this.userData.data.entity.splice(index, 1, result as IEntity);
          this.updateFilter();
          this.updateFilteredEntities();
        }
      });
  }

  public async multiRemoveEntities() {

    const loginData = await this.helper.confirmWithAuth(
      `Do you really want to delete these ${this.getSelection().length} items?`,
      `Validate login before deleting.`,
    );

    this.getSelection().forEach(entity => {
      this.removeEntity(entity, loginData);
    });

    this.clearSelection();
  }

  public async singleRemoveEntity(entity: IEntity) {
    const loginData = await this.helper.confirmWithAuth(
      `Do you really want to delete ${entity.name}?`,
      `Validate login before deleting ${entity.name}`,
    );

    this.removeEntity(entity, loginData);
  }

  public async removeEntity(entity: IEntity, loginData) {

    if (!loginData) return;
    const { username, password } = loginData;

    // Delete
    this.backend
      .deleteRequest(entity._id, 'entity', username, password)
      .then(result => {
        console.log(result);
        if (this.userData?.data?.entity) {
          this.userData.data.entity = (this.userData.data.entity as IEntity[]).filter(
            _e => _e._id !== entity._id,
          );
          this.updateFilter();
          this.updateFilteredEntities();
        }
      })
      .catch(e => console.error(e));
  }

  // ToDo: discuss managing owners for multiple entities
  // manageOwners(){
  //   // Step 3
  //   //tbc
  //   //openEntityOwnerSelection(entity)
  // }

  public openCompilationWizard() {
    if(!this.getSelection()) return;
    this.helper.openCompilationWizard(this.getSelection());
  }

  public async quickAddToCompilation(comp: ICompilation) {
    if(!this.getSelection()) return;

    for(const entity of this.getSelection()) {
      await this.quickAdd.quickAddToCompilation(comp, entity._id.toString());
    }
  }

  // Selection
  public isSelected(entity: IEntity): boolean {
    return this.selection.isSelected(entity);
  }

  public addEntityToSelection(entity: IEntity, event: MouseEvent) {
    this.selection.addToSelection(entity, event);
  }

  public getSelection(): IEntity[] {
    return this.selection.selectedEntities();
  }

  public clearSelection() {
    this.selection.clearSelection();
  }

  onMouseDown(event: MouseEvent): void {
    if(!event.shiftKey) {
      this.selection.onMouseDown(event);
    }
  }

  onMouseMove(event: MouseEvent): void {
    this.selection.onMouseMove(event);
  }

  onMouseUp(): void {
    this.selection.onMouseUp();

    const selectionRect = this.selection.getCurrentBoxRect();
    if (!selectionRect) return;
  
    const entityElementPairs = this.filteredEntities().map((entity, index) => ({
      entity,
      element: this.gridItems.get(index)?.nativeElement as HTMLElement
    }));
  
    this.selection.selectEntitiesInRect(selectionRect, entityElementPairs);
  }

  onMouseLeave() {
    this.selection.onMouseLeave();
  }

  async ngOnInit() {
    this.updateFilteredEntities();
  }

}

