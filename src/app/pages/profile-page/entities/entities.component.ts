import { AsyncPipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  output,
  signal,
  TemplateRef,
  viewChild,
  viewChildren,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatRadioModule } from '@angular/material/radio';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { combineLatest, map, switchMap } from 'rxjs';
import { GridElementComponent } from 'src/app/components';
import { Pagination, PaginationComponent } from 'src/app/components/pagination/pagination.component';
import { TranslatePipe } from 'src/app/pipes';
import {
  AccountService,
  BackendService,
  DialogHelperService,
  SnackbarService,
} from 'src/app/services';
import { SelectionService } from 'src/app/services/selection.service';
import {
  Collection,
  EntityAccessRole,
  IEntity,
  isEntity,
  isMetadataEntity,
} from '@kompakkt/common';
import { SelectionContainerComponent } from 'src/app/components/selection/selection-container.component';
import { IsUserOfRolePipe } from 'src/app/pipes/is-user-of-role.pipe';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ExploreFilterOption } from '../../explore/explore-filter-option/explore-filter-option.component';
import {
  AvailableAnnotationOptions,
  AvailableMiscOptions,
  reduceExploreFilterOptions,
  SortOrder,
} from '../../explore/shared-types';
import { ExploreFilterSidenavOptionsService } from '../../explore/explore-filter-sidenav/explore-filter-sidenav.component';

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
    FormsModule,
    TranslatePipe,
    AsyncPipe,
    SelectionContainerComponent,
    IsUserOfRolePipe,
    MatCheckboxModule,
    PaginationComponent,
  ],
})
export class ProfileEntitiesComponent implements AfterViewInit {
  private account = inject(AccountService);
  private backend = inject(BackendService);
  private helper = inject(DialogHelperService);
  private _rootSelectionService = inject(SelectionService);
  private snackbar = inject(SnackbarService);
  #sidenavOptionsService = inject(ExploreFilterSidenavOptionsService);

  searchText = input<string>('');
  searchText$ = toObservable(this.searchText);
  entityType = input.required<'finished' | 'unfinished'>();
  isDraft = computed(() => this.entityType() === 'unfinished');
  entityType$ = toObservable(this.entityType);
  selectedFilterOptions = input<ExploreFilterOption[]>([]);
  selectedFilterOptions$ = toObservable(this.selectedFilterOptions);

  gridItems = viewChildren<ElementRef>('gridItem');

  selectionContainer = viewChild<SelectionContainerComponent>('sc');
  selectionActionsTpl = viewChild.required<TemplateRef<unknown>>('selectionActions');
  actionsTemplateChange = output<TemplateRef<unknown>>();

  public selectionService = computed<SelectionService>(
    () => this.selectionContainer()?.selectionService ?? this._rootSelectionService,
  );

  public user = toSignal(this.account.user$);

  editorEntitiesInSelection = computed(() =>
    this.selectionService().filterByRole(this.user()?._id, EntityAccessRole.editor),
  );
  selectionHasEditorEntities = computed(() => this.editorEntitiesInSelection().length > 0);

  viewerEntitiesInSelection = computed(() =>
    this.selectionService().filterByRole(this.user()?._id, EntityAccessRole.viewer),
  );
  selectionHasViewerEntities = computed(() => this.viewerEntitiesInSelection().length > 0);

  readonly singleSelectedEntity = computed(() => this.selectionService().singleSelectedEntity());

  public paginator = signal<Pagination>({
    pageCount: Number.POSITIVE_INFINITY,
    pageSize: 24,
    totalItemCount: -1,
    pageIndex: 0,
  });
  #paginator$ = toObservable(this.paginator);

  public userCompilations = toSignal(this.account.compilations$, {
    initialValue: null,
  });

  isOwner(entity: IEntity): boolean {
    const user = this.user();
    if (!user?._id) return false;

    const userAccess = entity.access.find(u => u._id === user._id);
    return userAccess?.role === EntityAccessRole.owner;
  }

  entitiesByEntityType$ = this.entityType$.pipe(
    switchMap(type =>
      type === 'finished' ? this.account.finishedEntities$ : this.account.draftEntities$,
    ),
  );
  entitiesByEntityTypeSignal = toSignal(this.entitiesByEntityType$);

  filteredEntities$ = combineLatest([
    this.account.user$,
    this.entitiesByEntityType$,
    this.searchText$.pipe(map(text => text.trim().toLowerCase())),
    this.selectedFilterOptions$.pipe(map(options => reduceExploreFilterOptions(options))),
  ]).pipe(
    map(([userdata, entities, searchText, filterOptions]) => {
      if (!entities) return [];
      const sortOrder = (filterOptions.sortBy as SortOrder[] | undefined)?.at(0) ?? SortOrder.newest;
      return entities
        .filter(entity => {
          if (filterOptions.mediaType) {
            if (!filterOptions.mediaType.includes(entity.mediaType)) return false;
          }
          if (filterOptions.annotation) {
            const withAnnotations = filterOptions.annotation.includes(
              AvailableAnnotationOptions.withAnnotations.value,
            );
            const withoutAnnotations = filterOptions.annotation.includes(
              AvailableAnnotationOptions.withoutAnnotations.value,
            );
            const count = getAnnotationCount(entity);
            if (withAnnotations && withoutAnnotations) {
              // both selected → no-op
            } else {
              if (withAnnotations && count === 0) return false;
              if (withoutAnnotations && count > 0) return false;
            }
          }
          if (filterOptions.access) {
            if (!userdata) return false;
            const userAccess = entity.access.find(u => u._id === userdata._id)?.role;
            if (!userAccess || !filterOptions.access.includes(userAccess)) return false;
          }
          if (filterOptions.misc) {
            if (
              filterOptions.misc.includes(AvailableMiscOptions.downloadable.value) &&
              !entity.__downloadable
            )
              return false;
          }
          if (filterOptions.licence) {
            if (
              !entity.__licenses ||
              !filterOptions.licence.some(l => entity.__licenses?.includes(l))
            )
              return false;
          }
          if (searchText.length > 0) {
            let content = entity.name;
            if (isMetadataEntity(entity.relatedDigitalEntity)) {
              content += entity.relatedDigitalEntity.title;
              content += entity.relatedDigitalEntity.description;
            }
            if (!content.toLowerCase().includes(searchText)) return false;
          }
          return true;
        })
        .sort((a, b) => {
          if (!sortOrder) return 0;
          switch (sortOrder) {
            case SortOrder.annotations:
              return getAnnotationCount(b) - getAnnotationCount(a);
            case SortOrder.name:
              return (a.__normalizedName || a.name).localeCompare(
                b.__normalizedName || b.name,
              );
            case SortOrder.popularity:
              return (b.__hits ?? 0) - (a.__hits ?? 0);
            case SortOrder.newest:
              return (b.__createdAt ?? 0) - (a.__createdAt ?? 0);
            default:
              return (b.__hits ?? 0) - (a.__hits ?? 0);
          }
        });
    }),
  );

  filteredEntitiesSignal = toSignal(this.filteredEntities$);

  paginatorEntities$ = combineLatest([this.filteredEntities$, this.#paginator$]).pipe(
    map(([entities, { pageSize, pageIndex }]) => {
      const start = pageSize * pageIndex;
      return entities.slice(start, start + pageSize);
    }),
  );

  paginatorEntitiesSignal = toSignal(this.paginatorEntities$);

  constructor() {
    this.filteredEntities$.subscribe(entities => {
      this.#sidenavOptionsService.setResultCount(entities.length);
      this.paginator.update(paginator => ({
        ...paginator,
        pageIndex: 0,
        pageCount: Math.ceil(entities.length / paginator.pageSize),
        totalItemCount: entities.length,
      }));
    });
  }

  //Single entities
  public continueEntityUpload(entity: IEntity) {
    this.editEntity(entity);
  }

  public editViewerSettings(entity: IEntity) {
    this.helper.editSettingsInViewer(entity);
  }

  public async editEntity(entity: IEntity) {
    const resolvedEntity = await this.backend.getEntity(entity._id);

    return this.helper.editEntity(resolvedEntity);
  }

  //Multi entities

  public openTransferOwnerDialog(entity?: IEntity) {
    const selection = this.selectionService().selectedElements();
    const data = entity ?? (selection.length === 1 ? selection[0] : selection);
    if (!isEntity(data)) return;
    this.helper.openTransferOwnershipDialog(data);
  }

  public openVisibilityAndAccessDialog(entity?: IEntity) {
    const selection = this.selectionService().selectedElements();
    const data = entity ? [entity] : selection.filter(isEntity);
    this.helper.editVisibilityAndAccess(data);
    this.selectionService().clearSelection();
  }

  public async quickAddToCompilation(entity?: IEntity) {
    const selectedEntities = (() => {
      if (entity) return [entity];
      const selection = this.selectionService().selectedElements();
      if (!selection || selection.length === 0) return [];
      return this.selectionService().selectedElements().filter(isEntity);
    })();

    if (selectedEntities.length === 0) {
      this.snackbar.showMessage('Please select at least one entity to add to the compilation.', 5);
      return;
    }

    this.helper
      .addToCompilation(selectedEntities)
      .afterClosed()
      .subscribe(result => {
        if (result?.hasSavedChanges) {
          this.selectionService().clearSelection();
        }
      });
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
      `Do you really want to delete these ${this.selectionService().selectedElements().length} items?`,
      `Validate login before deleting.`,
    );
    if (!loginData) return;
    this.selectionService()
      .selectedElements()
      .forEach(entity => {
        if (isEntity(entity)) {
          this.removeEntity(entity, loginData);
        }
      });

    this.selectionService().clearSelection();
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
    return this.selectionService().isSelected(entity);
  }

  public addEntityToSelection(entity: IEntity, event: MouseEvent) {
    if (event.shiftKey) {
      this.selectionService().updateSelectionWithRange(
        entity,
        this.paginatorEntitiesSignal() ?? [],
      );
    } else {
      this.selectionService().updateSelection(entity, event);
      this.selectionService().lastSelectedIndex.set(
        (this.paginatorEntitiesSignal() ?? []).indexOf(entity),
      );
    }
  }

  public changeSelectionOnCheckbox(entity: IEntity) {
    this.selectionService().updateSelection(entity, undefined, true);
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
      this.selectionService().onMouseDown(event);

      document.addEventListener('mouseup', () => this.onMouseUp(), {
        once: true,
      });
    }
  }

  onMouseMove(event: MouseEvent) {
    this.selectionService().onMouseMove(event);
  }

  onMouseUp() {
    const selectionRect = this.selectionService().getCurrentBoxRect();
    this.selectionService().stopDragging();
    if (!selectionRect) return;

    const user = this.user();
    if (!user?._id) {
      this.snackbar.showMessage('You must be logged in to select entities.', 5);
      return;
    }

    const entityElementPairs =
      this.paginatorEntitiesSignal()?.map((element, index) => ({
        element,
        htmlElement: this.gridItems()[index].nativeElement as HTMLElement,
      })) || [];

    this.selectionService().selectElementsInRect(selectionRect, entityElementPairs);
  }

  ngAfterViewInit() {
    this.actionsTemplateChange.emit(this.selectionActionsTpl());
  }
}
