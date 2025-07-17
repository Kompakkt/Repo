import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, computed, ElementRef, QueryList, signal, ViewChildren } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatRadioModule } from '@angular/material/radio';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterModule } from '@angular/router';
import DeepClone from 'rfdc';
import { BehaviorSubject, combineLatest, map } from 'rxjs';
import { GridElementComponent } from 'src/app/components';
import { EntityRightsDialogComponent, EntitySettingsDialogComponent } from 'src/app/dialogs';
import { TranslatePipe } from 'src/app/pipes';
import { AccountService, BackendService, DialogHelperService } from 'src/app/services';
import { SelectionService } from 'src/app/services/selection.service';
import { AddEntityWizardComponent } from 'src/app/wizards';
import { Collection, IEntity, isMetadataEntity } from 'src/common';
import { SelectionBox } from "../selection-box/selection-box.component";
const deepClone = DeepClone({ circles: true });

type EntityFilter = {
  published: boolean;
  unpublished: boolean;
  restricted: boolean;
  unfinished: boolean;
};

@Component({
  selector: 'app-profile-entities',
  templateUrl: './entities.component.html',
  styleUrls: ['./entities.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatExpansionModule,
    MatChipsModule,
    MatTooltipModule,
    MatInputModule,
    MatFormFieldModule,
    MatPaginatorModule,
    MatButtonModule,
    MatRadioModule,
    MatMenuModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    MatSlideToggleModule,
    GridElementComponent,
    FormsModule,
    TranslatePipe,
    AsyncPipe,
    SelectionBox
],
})
export class ProfileEntitiesComponent {
  @ViewChildren('gridItem', { read: ElementRef}) gridItems!: QueryList<ElementRef>;

  public filter$ = new BehaviorSubject<EntityFilter>({
    published: true,
    unpublished: false,
    restricted: false,
    unfinished: false,
  });

  public pageEvent$ = new BehaviorSubject<PageEvent>({
    previousPageIndex: 0,
    pageIndex: 0,
    pageSize: 20,
    length: Number.POSITIVE_INFINITY,
  });

  public selectedEntities = signal<Set<IEntity>>(new Set());

  private searchInput = new BehaviorSubject('');

  constructor(
    private translatePipe: TranslatePipe,
    private account: AccountService,
    private dialog: MatDialog,
    private backend: BackendService,
    private helper: DialogHelperService,
    private titleService: Title,
    private route: ActivatedRoute,
    private selectionService: SelectionService
  ) {
    this.filteredEntities$.subscribe(entities => {
      const pageEvent = this.pageEvent$.getValue();
      this.pageEvent$.next({ ...pageEvent, length: entities.length });
    });
  }

  public changeEntitySearchText(event: Event, paginator: MatPaginator) {
    const value = (event.target as HTMLInputElement)?.value ?? '';
    this.searchInput.next(value.toLowerCase());
    paginator.firstPage();
  }

  filteredEntities$ = combineLatest([
    this.account.publishedEntities$,
    this.account.unpublishedEntities$,
    this.account.restrictedEntities$,
    this.account.unfinishedEntities$,
    this.filter$,
  ]).pipe(
    map(
      ([
        publishedEntities,
        unpublishedEntities,
        restrictedEntities,
        unfinishedEntities,
        filter,
      ]) => {
        const { published, unpublished, restricted, unfinished } = filter;
        if (published) return publishedEntities;
        if (unpublished) return unpublishedEntities;
        if (restricted) return restrictedEntities;
        if (unfinished) return unfinishedEntities;
        return [];
      },
    ),
  );

  filteredEntitiesSignal = toSignal(this.filteredEntities$);

  paginatorEntities$ = combineLatest([
    this.filteredEntities$,
    this.searchInput,
    this.pageEvent$,
  ]).pipe(
    map(([arr, searchInput, { pageSize, pageIndex }]) => {
      if (!searchInput) return arr;
      const start = pageSize * pageIndex;
      const end = start + pageSize;
      return arr
        .filter(_e => {
          let content = _e.name;
          if (isMetadataEntity(_e.relatedDigitalEntity)) {
            content += _e.relatedDigitalEntity.title;
            content += _e.relatedDigitalEntity.description;
          }
          return content.toLowerCase().includes(searchInput);
        })
        .slice(start, end);
    }),
  );

  // userCompilations = computed(() => {
  //   return this.userData.data.compilation?.filter(comp => isCompilation(comp)) ?? [];
  // });

  public async updateFilter(property?: string, paginator?: MatPaginator) {
    const filter = this.filter$.getValue();
    // On radio button change
    if (property) {
      this.clearSelection();
      // Disable wrong filters
      for (const prop in filter) {
        (filter as any)[prop] = prop === property;
      }
    }
    this.filter$.next({ ...filter });

    if (paginator) paginator.firstPage();
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
        this.account.updateTrigger$.next(Collection.entity);
      });
  }

  public editViewerSettings(entity: IEntity) {
    this.helper.editSettingsInViewer(entity);
  }

  public continueEntityUpload(entity: IEntity) {
    this.editEntity(entity);
  }

  public openEntityOwnerSelection(entity: IEntity) {
    this.dialog.open(EntityRightsDialogComponent, {
      data: entity,
      disableClose: false,
    });
  }

  public openCompilationWizard() {

  }

  public openTransferOwner() {

  }

  public async editEntity(entity: IEntity) {
    const resolvedEntity = await this.backend.getEntity(entity._id);

    const dialogRef = this.dialog.open(AddEntityWizardComponent, {
      data: resolvedEntity,
      disableClose: true,
    });

    dialogRef
      .afterClosed()
      .toPromise()
      .then(result => {
        this.account.updateTrigger$.next(Collection.entity);
        this.updateFilter();
      });
  }

  public async singleRemoveEntity(entity: IEntity) {
    const loginData = await this.helper.confirmWithAuth(
      `Do you really want to delete ${entity.name}?`,
      `Validate login before deleting ${entity.name}`,
    );

    this.removeEntity(entity, loginData);
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

  public async removeEntity(entity: IEntity, loginData) {

    if (!loginData) return;
    const { username, password } = loginData;

    // Delete
    this.backend
      .deleteRequest(entity._id, 'entity', username, password)
      .then(result => {
        this.account.updateTrigger$.next(Collection.entity);
        this.updateFilter();
      })
      .catch(e => console.error(e));
  }

  //Selection
    public isSelected(entity: IEntity): boolean {
    return this.selectionService.isSelected(entity);
  }

  public addEntityToSelection(entity: IEntity, event: MouseEvent) {
    this.selectionService.addToSelection(entity, event);
  }

  public getSelection(): IEntity[] {
    return this.selectionService.selectedEntities();
  }

  public clearSelection() {
    this.selectionService.clearSelection();
  }

  onMouseDown(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (['BUTTON', 'INPUT', 'MAT-ICON', 'MAT-MENU-ITEM'].includes(target.tagName)) {
      return;
    }

    if(!event.shiftKey) {
      this.selectionService.onMouseDown(event);
    }
  }

  onMouseMove(event: MouseEvent) {
    this.selectionService.onMouseMove(event);
  }

  onMouseUp() {
    this.selectionService.onMouseUp();

    const selectionRect = this.selectionService.getCurrentBoxRect();
    if (!selectionRect) return;
  
    const entityElementPairs = this.filteredEntitiesSignal()?.map((entity, index) => ({
      entity,
      element: this.gridItems.get(index)?.nativeElement as HTMLElement
    })) || [];
  
    this.selectionService.selectEntitiesInRect(selectionRect, entityElementPairs);
  }

  onMouseLeave() {
    this.selectionService.onMouseLeave();
  }
}
