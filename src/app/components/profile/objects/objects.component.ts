import { Component, computed, effect, Input, OnChanges, OnInit, signal, SimpleChanges } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { AsyncPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { BehaviorSubject, combineLatest, firstValueFrom, map, tap } from 'rxjs';


import { MatIconButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import {
  MatAccordion,
  MatExpansionPanel,
  MatExpansionPanelActionRow,
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

import { IEntity, IUserData, isMetadataEntity } from '../../../../common';
import { TranslatePipe } from "../../../pipes/translate.pipe";
import { GridElementComponent } from "../../grid-element/grid-element.component";
import { AccountService, BackendService, DialogHelperService } from '../../../services';
import { EntityRightsDialogComponent, EntitySettingsDialogComponent } from '../../../dialogs';
import { AddEntityWizardComponent } from '../../../wizards';

@Component({
  selector: 'app-objects',
  standalone: true,
  imports: [
    AsyncPipe,
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
    GridElementComponent
],
  templateUrl: './objects.component.html',
  styleUrl: './objects.component.scss'
})
export class ObjectsComponent implements OnInit {
  @Input() userData!: IUserData;
  public selectedEntities = signal<Set<IEntity>>(new Set());
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
  ) {}

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
  
  paginatorEntities = computed(() => {
    const entities = this.filteredEntities();
    const searchInput = this.searchInput(); 
  
    if (!searchInput) return entities;
  
    const start = this.pageEvent.pageSize * this.pageEvent.pageIndex;
    const end = start + this.pageEvent.pageSize;
  
    return entities
      .filter(_e => {
        let content = _e.name;
        if (isMetadataEntity(_e.relatedDigitalEntity)) {
          content += _e.relatedDigitalEntity.title;
          content += _e.relatedDigitalEntity.description;
        }
        return content.toLowerCase().includes(searchInput.toLowerCase());
      })
      .slice(start, end);
  });

  public hasEntityID(entityId: string): boolean {
    return [...this.selectedEntities()].some(e => e.relatedDigitalEntity._id === entityId);
  }

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
  
  public addToSelection(entity: IEntity, event: MouseEvent) {
    this.selectedEntities.update((selection) => {
      const newSelection = new Set(selection);
      const existingEntity = [...newSelection].some(e => e.relatedDigitalEntity._id === entity.relatedDigitalEntity._id);

      if(event.shiftKey) {
        existingEntity ? newSelection.delete(entity) : newSelection.add(entity);
      } else {
        newSelection.clear();
        newSelection.add(entity);
      }
      
      return newSelection;
    });
  }

  public clearSelection() {
    this.selectedEntities().clear();
  }

  public async multiRemoveEntities() {
    const loginData = await this.helper.confirmWithAuth(
      `Do you really want to delete these ${this.selectedEntities().size} items?`,
      `Validate login before deleting.`,
    );

    this.selectedEntities().forEach(entity => {
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

  addEntitiesToCollection(){
    console.log("Add Entity to collection");
  }

  manageOwners(){
    console.log("Visibility and access => to be continued!")
    //tbc
    //openEntityOwnerSelection(entity)
  }

  async ngOnInit() {
    this.updateFilteredEntities();
  }

}

