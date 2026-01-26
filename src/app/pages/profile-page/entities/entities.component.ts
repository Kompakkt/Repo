import { AsyncPipe, CommonModule } from '@angular/common';
import {
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  Pipe,
  QueryList,
  signal,
  viewChild,
  ViewChildren,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatRadioModule } from '@angular/material/radio';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import DeepClone from 'rfdc';
import {
  BehaviorSubject,
  combineLatest,
  combineLatestWith,
  firstValueFrom,
  map,
  switchMap,
} from 'rxjs';
import { GridElementComponent } from 'src/app/components';
import { ManageOwnershipComponent } from 'src/app/dialogs/manage-ownership/manage-ownership.component';
import { VisibilityAndAccessDialogComponent } from 'src/app/dialogs/visibility-and-access-dialog/visibility-and-access-dialog.component';
import { TranslatePipe } from 'src/app/pipes';
import {
  AccountService,
  BackendService,
  DialogHelperService,
  QuickAddService,
} from 'src/app/services';
import { SelectionService } from 'src/app/services/selection.service';
import { AddCompilationWizardComponent, AddEntityWizardComponent } from 'src/app/wizards';
import { Collection, ICompilation, IEntity, isMetadataEntity } from 'src/common';
import { IUserData, IUserDataWithoutData } from 'src/common/interfaces';
import { SelectionBox } from '../selection-box/selection-box.component';
import { IsUserOfRolePipe } from 'src/app/pipes/is-user-of-role.pipe';
import {
  Pagination,
  PaginationComponent,
} from 'src/app/components/pagination/pagination.component';
import { NotificationService } from 'src/app/components/notification-area/notification-area.component';
import { ExploreFilterOption } from '../../explore/explore-filter-option/explore-filter-option.component';
import {
  AvailableAnnotationOptions,
  AvailableMiscOptions,
  reduceExploreFilterOptions,
  SortOrder,
} from '../../explore/shared-types';
const deepClone = DeepClone({ circles: true });

const getAnnotationCount = (entity: IEntity): number => {
  if (entity.__annotationCount !== undefined) {
    return entity.__annotationCount;
  }
  return Object.keys(entity.annotations || {}).length;
};

@Component({
  selector: 'app-profile-entities',
  templateUrl: './entities.component.html',
  styleUrls: ['./entities.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatChipsModule,
    MatTooltipModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatRadioModule,
    MatMenuModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    MatSlideToggleModule,
    GridElementComponent,
    PaginationComponent,
    FormsModule,
    TranslatePipe,
    AsyncPipe,
    SelectionBox,
    IsUserOfRolePipe,
  ],
})
export class ProfileEntitiesComponent {
  private account = inject(AccountService);
  private dialog = inject(MatDialog);
  private backend = inject(BackendService);
  private helper = inject(DialogHelperService);
  private quickAdd = inject(QuickAddService);
  public selectionService = inject(SelectionService);
  private notification = inject(NotificationService);

  selectedFilterOptions = input<ExploreFilterOption[]>([]);
  selectedFilterOptions$ = toObservable(this.selectedFilterOptions);
  searchText = input<string>('');
  searchText$ = toObservable(this.searchText);
  entityType = input.required<'finished' | 'unfinished'>();
  isDraft = computed(() => this.entityType() === 'unfinished');
  entityType$ = toObservable(this.entityType);

  entitiesByEntityType$ = this.entityType$.pipe(
    switchMap(type =>
      type === 'finished' ? this.account.finishedEntities$ : this.account.draftEntities$,
    ),
  );

  @ViewChildren('gridItem', { read: ElementRef }) gridItems!: QueryList<ElementRef>;

  editorEntitiesInSelection = this.findRoleInSelection('editor');
  selectionHasEditorEntities = computed(() => this.editorEntitiesInSelection().length > 0);

  viewerEntitiesInSelection = this.findRoleInSelection('viewer');
  selectionHasViewerEntities = computed(() => this.viewerEntitiesInSelection().length > 0);

  private findRoleInSelection(role: 'editor' | 'viewer') {
    return computed(() => {
      const selectedEntities = this.selectionService.selectedEntities();
      const user = this.user();
      if (!user?._id) return [];
      return selectedEntities.filter(entity => {
        const userAccess = entity.access?.[user._id];
        return userAccess?.role === role;
      });
    });
  }

  readonly singleSelectedEntity = computed(() => {
    const entities = this.selectionService.selectedEntities();
    return entities.length === 1 ? entities[0] : null;
  });

  public paginator = signal<Pagination>({
    pageCount: Number.POSITIVE_INFINITY,
    pageSize: 24,
    totalItemCount: -1,
    pageIndex: 0,
  });
  #paginator$ = toObservable(this.paginator);

  public selectedEntities = signal<Set<IEntity>>(new Set());
  public userCompilations = toSignal(this.account.compilations$, { initialValue: null });

  isOwner(entity: IEntity): boolean {
    const user = this.user();
    if (!user?._id) return false;

    const userAccess = entity.access?.[user._id];
    return userAccess?.role === 'owner';
  }

  constructor() {
    this.filteredEntities$.subscribe(entities => {
      this.paginator.update(paginator => ({
        ...paginator,
        pageIndex: 0,
        pageCount: Math.ceil(entities.length / paginator.pageSize),
        totalItemCount: entities.length,
      }));
    });
  }

  public user = toSignal(this.account.user$);

  filteredEntities$ = combineLatest([
    this.account.user$,
    this.entitiesByEntityType$,
    this.searchText$.pipe(map(text => text.trim().toLowerCase())),
    this.selectedFilterOptions$.pipe(map(options => reduceExploreFilterOptions(options))),
  ]).pipe(
    map(([userdata, entities, searchText, filterOptions]) => {
      const sortOrder = (filterOptions.sortBy as SortOrder[])?.at(0);
      return entities
        .filter(entity => {
          if (filterOptions.mediaType) {
            const hasMediaType = filterOptions.mediaType!.includes(entity.mediaType);
            if (!hasMediaType) return false;
          }

          if (filterOptions.annotation) {
            const onlyWithAnnotations = filterOptions.annotation.includes(
              AvailableAnnotationOptions.withAnnotations.value,
            );
            const onlyWithoutAnnotations = filterOptions.annotation.includes(
              AvailableAnnotationOptions.withoutAnnotations.value,
            );

            const count = getAnnotationCount(entity);
            if (onlyWithAnnotations && onlyWithAnnotations) {
              // Both selected, no filtering
            } else {
              if (onlyWithAnnotations && count === 0) return false;
              if (onlyWithoutAnnotations && count > 0) return false;
            }
          }

          if (filterOptions.access) {
            if (!userdata) return false;
            const selectedRoles = filterOptions.access;

            const userAccess = entity.access?.[userdata._id]?.role;
            if (!userAccess || !selectedRoles.includes(userAccess)) return false;
          }

          if (filterOptions.misc) {
            const miscOptions = filterOptions.misc;

            if (
              miscOptions.includes(AvailableMiscOptions.downloadable.value) &&
              !entity.__downloadable
            )
              return false;
          }

          if (filterOptions.licence) {
            const selectedLicences = filterOptions.licence;
            if (!entity.__licenses || !selectedLicences.some(l => entity.__licenses?.includes(l)))
              return false;
          }

          if (searchText.length > 0) {
            let content = entity.name;
            if (isMetadataEntity(entity.relatedDigitalEntity)) {
              content += entity.relatedDigitalEntity.title;
              content += entity.relatedDigitalEntity.description;
            }
            const hasSearchText = content.toLowerCase().includes(searchText);
            if (!hasSearchText) return false;
          }

          return true;
        })
        .sort((a, b) => {
          if (!sortOrder) return 0;
          switch (sortOrder) {
            case SortOrder.annotations: {
              return getAnnotationCount(b) - getAnnotationCount(a);
            }
            case SortOrder.name: {
              return (a.__normalizedName || a.name).localeCompare(b.__normalizedName || b.name);
            }
            case SortOrder.popularity: {
              return (b.__hits ?? 0) - (a.__hits ?? 0);
            }
            case SortOrder.newest: {
              return (b.__createdAt ?? 0) - (a.__createdAt ?? 0);
            }
            default: {
              return (b.__hits ?? 0) - (a.__hits ?? 0);
            }
          }
        });
    }),
  );

  paginatorEntities$ = combineLatest([this.filteredEntities$, this.#paginator$]).pipe(
    map(([entities, { pageSize, pageIndex }]) => {
      const start = pageSize * pageIndex;
      return entities.slice(start, start + pageSize);
    }),
  );

  paginatorEntitiesSignal = toSignal(this.paginatorEntities$);

  //Single entities
  public continueEntityUpload(entity: IEntity) {
    this.editEntity(entity);
  }

  public editViewerSettings(entity: IEntity) {
    this.helper.editSettingsInViewer(entity);
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
      });
  }

  //Multi entities

  public openTransferOwnerDialog(entity?: IEntity) {
    const selection = this.selectionService.selectedEntities();
    const data = entity ?? (selection.length === 1 ? selection[0] : selection);

    const dialogRef = this.dialog.open(ManageOwnershipComponent, {
      data: data,
      disableClose: false,
    });

    dialogRef
      .afterClosed()
      .toPromise()
      .then(result => {
        this.account.updateTrigger$.next(Collection.entity);
      });
  }

  public openVisibilityAndAccessDialog(entity?: IEntity) {
    const selection = this.selectionService.selectedEntities();
    const data = entity ?? (selection.length === 1 ? selection[0] : selection);

    const dialogRef = this.dialog.open(VisibilityAndAccessDialogComponent, {
      data: data,
      disableClose: true,
    });

    firstValueFrom(dialogRef.afterClosed()).then(
      (result: null | undefined | IEntity | ICompilation) => {
        if (!result) return;
        this.account.updateTrigger$.next(Collection.entity);
      },
    );

    this.selectionService.clearSelection();
  }

  public openCompilationWizard() {
    const selection = this.selectionService.selectedEntities();
    if (!selection || selection.length === 0) {
      this.notification.showNotification({
        message: 'Please select at least one entity to add to a compilation.',
        type: 'warn',
      });
      return;
    }

    const dialogRef = this.dialog.open(AddCompilationWizardComponent, {
      data: selection,
      disableClose: true,
    });
    dialogRef
      .afterClosed()
      .toPromise()
      .then((result: undefined | ICompilation) => {
        this.account.updateTrigger$.next(Collection.compilation);
      });

    this.selectionService.clearSelection();
  }

  public async quickAddToCompilation(comp: ICompilation) {
    const selection = this.selectionService.selectedEntities();
    if (!selection || selection.length === 0) {
      this.notification.showNotification({
        message: 'Please select at least one entity to add to the compilation.',
        type: 'warn',
      });
      return;
    }

    for (const entity of selection) {
      await this.quickAdd.quickAddToCompilation(comp, entity._id.toString());
    }

    this.selectionService.clearSelection();
  }

  public async singleRemoveEntity(entity: IEntity) {
    const loginData = await this.helper.confirmWithAuth(
      `Do you really want to delete ${entity.name}?`,
      `Validate login before deleting ${entity.name}`,
    );
    if (!loginData) return;
    this.removeEntity(entity, loginData);
  }

  public async multiRemoveEntities() {
    const loginData = await this.helper.confirmWithAuth(
      `Do you really want to delete these ${this.selectionService.selectedEntities().length} items?`,
      `Validate login before deleting.`,
    );
    if (!loginData) return;
    this.selectionService.selectedEntities().forEach(entity => {
      this.removeEntity(entity, loginData);
    });

    this.selectionService.clearSelection();
  }

  public async removeEntity(entity: IEntity, loginData: { username: string; password: string }) {
    const { username, password } = loginData;
    const isOwner = this.isOwner(entity);

    if (isOwner) {
      this.backend
        .deleteRequest(entity._id, 'entity', username, password)
        .then(result => {
          this.account.updateTrigger$.next(Collection.entity);
        })
        .catch(e => console.error(e));
    } else {
      this.backend
        .removeSelfFromAccess('entity', entity._id)
        .then(result => {
          this.account.updateTrigger$.next(Collection.entity);
        })
        .catch(e => console.error(e));
    }
  }

  //Selection
  public isSelected(entity: IEntity): boolean {
    return this.selectionService.isSelected(entity);
  }

  public addEntityToSelection(entity: IEntity, event: MouseEvent) {
    this.selectionService.addToSelection(entity, event);
  }

  onMouseDown(event: MouseEvent) {
    const target = event.target as HTMLElement;

    const hasSelectionBoxParent = !!target.closest('.selection');
    const hasForbiddenTagName = ['BUTTON', 'INPUT', 'MAT-ICON', 'MAT-MENU-ITEM'].includes(
      target.tagName,
    );
    if (hasSelectionBoxParent || hasForbiddenTagName) {
      return;
    }

    if (!event.shiftKey && !event.ctrlKey) {
      this.selectionService.onMouseDown(event);
    }
  }

  onMouseMove(event: MouseEvent) {
    this.selectionService.onMouseMove(event);
  }

  onMouseUp() {
    this.selectionService.stopDragging();

    const selectionRect = this.selectionService.getCurrentBoxRect();
    if (!selectionRect) return;

    const user = this.user();
    if (!user?._id) {
      this.notification.showNotification({
        message: 'You must be logged in to select entities.',
        type: 'warn',
      });
      return;
    }

    const entityElementPairs =
      this.paginatorEntitiesSignal()?.map((entity, index) => ({
        entity,
        element: this.gridItems.get(index)?.nativeElement as HTMLElement,
      })) || [];

    this.selectionService.selectEntitiesInRect(selectionRect, entityElementPairs);
  }
}
