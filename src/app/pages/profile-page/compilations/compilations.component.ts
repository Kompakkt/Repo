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
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { combineLatest, firstValueFrom, map } from 'rxjs';

import { GridElementComponent } from 'src/app/components/grid-element/grid-element.component';
import { Pagination, PaginationComponent } from 'src/app/components/pagination/pagination.component';
import { SelectionContainerComponent } from 'src/app/components/selection/selection-container.component';
import { ManageOwnershipComponent } from 'src/app/dialogs/manage-ownership/manage-ownership.component';
import { TranslatePipe } from 'src/app/pipes';
import {
  AccountService,
  BackendService,
  DialogHelperService,
  SnackbarService,
} from 'src/app/services';
import { SelectionService } from 'src/app/services/selection.service';
import { Collection, EntityAccessRole, ICompilation, isCompilation } from '@kompakkt/common';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { IsUserOfRolePipe } from 'src/app/pipes/is-user-of-role.pipe';
import { ExploreFilterOption } from '../../explore/explore-filter-option/explore-filter-option.component';
import {
  AvailableAnnotationOptions,
  AvailableMiscOptions,
  reduceExploreFilterOptions,
  SortOrder,
} from '../../explore/shared-types';
import { ExploreFilterSidenavOptionsService } from '../../explore/explore-filter-sidenav/explore-filter-sidenav.component';

@Component({
  selector: 'app-profile-compilations',
  templateUrl: './compilations.component.html',
  styleUrls: ['./compilations.component.scss'],
  standalone: true,
  imports: [
    MatChipsModule,
    GridElementComponent,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
    RouterLink,
    MatDividerModule,
    MatSlideToggleModule,
    FormsModule,
    TranslatePipe,
    AsyncPipe,
    IsUserOfRolePipe,
    SelectionContainerComponent,
    MatCheckboxModule,
    PaginationComponent,
  ],
})
export class ProfileCompilationsComponent implements AfterViewInit {
  #account = inject(AccountService);
  #dialog = inject(MatDialog);
  #backend = inject(BackendService);
  #dialogHelper = inject(DialogHelperService);
  #rootSelectionService = inject(SelectionService);
  #snackbar = inject(SnackbarService);
  #sidenavOptionsService = inject(ExploreFilterSidenavOptionsService);

  gridItems = viewChildren<ElementRef>('gridItem');

  selectionContainer = viewChild<SelectionContainerComponent>('sc');
  selectionActionsTpl = viewChild.required<TemplateRef<unknown>>('selectionActions');
  actionsTemplateChange = output<TemplateRef<unknown>>();

  searchText = input<string>('');
  searchText$ = toObservable(this.searchText);
  selectedFilterOptions = input<ExploreFilterOption[]>([]);
  selectedFilterOptions$ = toObservable(this.selectedFilterOptions);

  user = toSignal(this.#account.user$);

  editorCompilationsInSelection = computed(() =>
    this.selectionService().filterByRole(this.user()?._id, EntityAccessRole.editor),
  );
  selectionHasEditorCompilations = computed(() => this.editorCompilationsInSelection().length > 0);

  viewerCompilationsInSelection = computed(() =>
    this.selectionService().filterByRole(this.user()?._id, EntityAccessRole.viewer),
  );
  selectionHasViewerCompilations = computed(() => this.viewerCompilationsInSelection().length > 0);

  isOwner(compilation: ICompilation): boolean {
    const user = this.user();
    if (!user?._id) return false;

    const userAccess = compilation.access.find(u => u._id === user._id);
    return userAccess?.role === EntityAccessRole.owner;
  }

  public selectionService = computed<SelectionService>(
    () => this.selectionContainer()?.selectionService ?? this.#rootSelectionService,
  );

  compilations$ = this.#account.compilationsWithEntities$.pipe(
    map(compilations => compilations.filter(c => isCompilation(c))),
  );
  compilationsSignal = toSignal(this.compilations$);

  filteredCompilations$ = combineLatest([
    this.#account.user$,
    this.compilations$,
    this.searchText$.pipe(map(text => text.trim().toLowerCase())),
    this.selectedFilterOptions$.pipe(map(options => reduceExploreFilterOptions(options))),
  ]).pipe(
    map(([userdata, compilations, searchText, filterOptions]) => {
      if (!compilations) return [];
      const sortOrder = (filterOptions.sortBy as SortOrder[] | undefined)?.at(0) ?? SortOrder.newest;
      return compilations
        .filter(compilation => {
          if (filterOptions.annotation) {
            const withAnnotations = filterOptions.annotation.includes(
              AvailableAnnotationOptions.withAnnotations.value,
            );
            const withoutAnnotations = filterOptions.annotation.includes(
              AvailableAnnotationOptions.withoutAnnotations.value,
            );
            const count =
              compilation.__annotationCount ??
              Object.keys(compilation.annotations || {}).length;
            if (withAnnotations && withoutAnnotations) {
              // no-op
            } else {
              if (withAnnotations && count === 0) return false;
              if (withoutAnnotations && count > 0) return false;
            }
          }
          if (filterOptions.access) {
            if (!userdata) return false;
            const userAccess = compilation.access.find(u => u._id === userdata._id)?.role;
            if (!userAccess || !filterOptions.access.includes(userAccess)) return false;
          }
          if (filterOptions.misc) {
            if (
              filterOptions.misc.includes(AvailableMiscOptions.downloadable.value) &&
              !compilation.__downloadable
            )
              return false;
          }
          if (filterOptions.licence) {
            if (
              !compilation.__licenses ||
              !filterOptions.licence.some(l => compilation.__licenses?.includes(l))
            )
              return false;
          }
          if (searchText.length > 0) {
            const content =
              (compilation.__normalizedName || compilation.name) + compilation.description;
            if (!content.toLowerCase().includes(searchText)) return false;
          }
          return true;
        })
        .sort((a, b) => {
          if (!sortOrder) return 0;
          switch (sortOrder) {
            case SortOrder.annotations:
              return (
                (b.__annotationCount ?? Object.keys(b.annotations || {}).length) -
                (a.__annotationCount ?? Object.keys(a.annotations || {}).length)
              );
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

  filteredCompilationsSignal = toSignal(this.filteredCompilations$);

  public paginator = signal<Pagination>({
    pageCount: Number.POSITIVE_INFINITY,
    pageSize: 24,
    totalItemCount: -1,
    pageIndex: 0,
  });
  #paginator$ = toObservable(this.paginator);

  paginatorCompilations$ = combineLatest([this.filteredCompilations$, this.#paginator$]).pipe(
    map(([compilations, { pageSize, pageIndex }]) => {
      const start = pageSize * pageIndex;
      return compilations.slice(start, start + pageSize);
    }),
  );

  paginatorCompilationsSignal = toSignal(this.paginatorCompilations$);

  readonly singleSelectedCompilation = computed(() =>
    this.selectionService().singleSelectedCompilation(),
  );

  constructor() {
    this.filteredCompilations$.subscribe(compilations => {
      this.#sidenavOptionsService.setResultCount(compilations.length);
      this.paginator.update(paginator => ({
        ...paginator,
        pageIndex: 0,
        pageCount: Math.ceil(compilations.length / paginator.pageSize),
        totalItemCount: compilations.length,
      }));
    });
  }

  public openRemoveCompilationDialog(compilation: ICompilation) {
    this.#dialogHelper.removeFromCompilation(compilation);
  }

  public editCompilation(compilation: ICompilation) {
    this.#dialogHelper.createOrEditCompilation(compilation);
  }

  public openTransferOwnerDialog(compilation?: ICompilation) {
    const selection = this.selectionService().selectedElements();
    const data = compilation ?? (selection.length === 1 ? selection[0] : selection);

    const dialogRef = this.#dialog.open(ManageOwnershipComponent, {
      data: data,
      disableClose: false,
    });

    firstValueFrom(dialogRef.afterClosed()).then(result => {
      this.#account.updateTrigger$.next(Collection.compilation);
    });
  }

  public openVisibilityAndAccessDialog(compilation?: ICompilation) {
    const selection = this.selectionService().selectedElements();
    const data = compilation ? [compilation] : selection.filter(isCompilation);
    this.#dialogHelper.editVisibilityAndAccess(data);
    this.selectionService().clearSelection();
  }

  public async singleRemoveCompilation(compilation: ICompilation) {
    const loginData = await this.#dialogHelper.confirmWithAuth(
      `Do you really want to delete ${compilation.name}?`,
      `Validate login before deleting: ${compilation.name}`,
    );
    if (!loginData) return;
    this.removeCompilation(compilation, loginData);
  }

  public async multiRemoveCompilations() {
    const loginData = await this.#dialogHelper.confirmWithAuth(
      `Do you really want to delete these ${this.selectionService().selectedElements().length}?`,
      `Validate login before deleting.`,
    );
    if (!loginData) return;
    this.selectionService()
      .selectedElements()
      .forEach(compilation => {
        if (isCompilation(compilation)) {
          this.removeCompilation(compilation, loginData);
        }
      });

    this.selectionService().clearSelection();
  }

  private async removeCompilation(
    compilation: ICompilation,
    loginData: { username: string; password: string },
  ) {
    const { username, password } = loginData;
    const isOwner = this.isOwner(compilation);

    if (isOwner) {
      this.#backend
        .deleteRequest(compilation._id, 'compilation', username, password)
        .then(result => {
          this.#account.updateTrigger$.next(Collection.compilation);
        })
        .catch(e => console.error(e));
    } else {
      this.#backend
        .removeSelfFromAccess('compilation', compilation._id)
        .then(result => {
          this.#account.updateTrigger$.next(Collection.compilation);
        })
        .catch(e => console.error(e));
    }
  }

  //Selection

  public isSelected(compilation: ICompilation): boolean {
    return this.selectionService().isSelected(compilation);
  }

  public addCompilationToSelection(compilation: ICompilation, event: MouseEvent) {
    const allElements = this.filteredCompilationsSignal() ?? [];
    if (event.shiftKey) {
      this.selectionService().updateSelectionWithRange(compilation, allElements);
    } else {
      this.selectionService().updateSelection(compilation, event);
      this.selectionService().lastSelectedIndex.set(allElements.indexOf(compilation));
    }
  }

  public changeSelectionOnCheckbox(compilation: ICompilation) {
    this.selectionService().updateSelection(compilation, undefined, true);
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
      this.#snackbar.showMessage('You must be logged in to select entities.', 5);
      return;
    }

    const compElementPairs =
      this.paginatorCompilationsSignal()?.map((element, index) => ({
        element,
        htmlElement: this.gridItems()[index].nativeElement as HTMLElement,
      })) || [];

    this.selectionService().selectElementsInRect(selectionRect, compElementPairs);
  }

  ngAfterViewInit() {
    this.actionsTemplateChange.emit(this.selectionActionsTpl());
  }
}
