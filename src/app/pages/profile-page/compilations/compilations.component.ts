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
  effect,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { GridElementComponent } from 'src/app/components/grid-element/grid-element.component';
import {
  Pagination,
  PaginationComponent,
} from 'src/app/components/pagination/pagination.component';
import { SelectionContainerComponent } from 'src/app/components/selection/selection-container.component';
import { ManageOwnershipComponent } from 'src/app/dialogs/manage-ownership/manage-ownership.component';
import { NgxFluentPipe } from '@apappas1129/ngx-fluent';
import { SelectionService } from 'src/app/services/selection.service';
import { Collection, ICompilation, isCompilation } from '@kompakkt/common';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ExploreFilterOption } from '../../explore/explore-filter-option/explore-filter-option.component';
import {
  AvailableAnnotationOptions,
  AvailableMiscOptions,
  reduceExploreFilterOptions,
  SortOrder,
} from '../../explore/shared-types';
import { ExploreFilterSidenavOptionsService } from '../../explore/explore-filter-sidenav/explore-filter-sidenav.component';
import { PermissionService } from 'src/app/services/permissions.service';
import { AccountService } from 'src/app/services/account.service';
import { BackendService } from 'src/app/services/backend.service';
import { DialogHelperService } from 'src/app/services/dialog-helper.service';
import { SnackbarService } from 'src/app/services/snackbar.service';

@Component({
  selector: 'app-profile-compilations',
  templateUrl: './compilations.component.html',
  styleUrls: ['./compilations.component.scss'],
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
    NgxFluentPipe,
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
  permission = inject(PermissionService);

  gridItems = viewChildren<ElementRef>('gridItem');

  selectionContainer = viewChild<SelectionContainerComponent>('sc');
  selectionActionsTpl = viewChild.required<TemplateRef<unknown>>('selectionActions');
  actionsTemplateChange = output<TemplateRef<unknown>>();

  searchText = input<string>('');
  selectedFilterOptions = input<ExploreFilterOption[]>([]);

  selectionService = computed<SelectionService>(
    () => this.selectionContainer()?.selectionService ?? this.#rootSelectionService,
  );

  compilations = computed(() =>
    this.#account.compilationsWithEntities().filter(c => isCompilation(c)),
  );

  filteredCompilations = computed(() => {
    const compilations = this.compilations();
    const userdata = this.#account.user();
    const searchText = this.searchText().trim().toLowerCase();
    const filterOptions = reduceExploreFilterOptions(this.selectedFilterOptions());

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
            compilation.__annotationCount ?? Object.keys(compilation.annotations || {}).length;
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
            return (a.__normalizedName || a.name).localeCompare(b.__normalizedName || b.name);
          case SortOrder.popularity:
            return (b.__hits ?? 0) - (a.__hits ?? 0);
          case SortOrder.newest:
            return (b.__createdAt ?? 0) - (a.__createdAt ?? 0);
          default:
            return (b.__hits ?? 0) - (a.__hits ?? 0);
        }
      });
  });

  paginator = signal<Pagination>({
    pageCount: Number.POSITIVE_INFINITY,
    pageSize: 24,
    totalItemCount: -1,
    pageIndex: 0,
  });

  paginatorCompilations = computed(() => {
    const compilations = this.filteredCompilations();
    const { pageSize, pageIndex } = this.paginator();
    const start = pageSize * pageIndex;
    return compilations.slice(start, start + pageSize);
  });

  readonly singleSelectedCompilation = computed(() =>
    this.selectionService().singleSelectedCompilation(),
  );

  constructor() {
    effect(() => {
      const compilations = this.filteredCompilations();
      this.#sidenavOptionsService.setResultCount(compilations.length);
      this.paginator.update(paginator => ({
        ...paginator,
        pageIndex: 0,
        pageCount: Math.ceil(compilations.length / paginator.pageSize),
        totalItemCount: compilations.length,
      }));
    });
  }

  openRemoveCompilationDialog(compilation: ICompilation) {
    this.#dialogHelper.removeFromCompilation(compilation);
  }

  editCompilation(compilation: ICompilation) {
    this.#dialogHelper.createOrEditCompilation(compilation);
  }

  openTransferOwnerDialog(compilation?: ICompilation) {
    const selection = this.selectionService().selectedElements();
    const data = compilation ?? (selection.length === 1 ? selection[0] : selection);

    const dialogRef = this.#dialog.open(ManageOwnershipComponent, {
      data: data,
      disableClose: false,
    });

    void firstValueFrom(dialogRef.afterClosed()).then(() => {
      this.#account.updateTrigger$.next(Collection.compilation);
    });
  }

  openVisibilityAndAccessDialog(compilation?: ICompilation) {
    const selection = this.selectionService().selectedElements();
    const data = compilation ? [compilation] : selection.filter(isCompilation);
    this.#dialogHelper.editVisibilityAndAccess(data);
    this.selectionService().clearSelection();
  }

  async singleRemoveCompilation(compilation: ICompilation) {
    const loginData = await this.#dialogHelper.confirmWithAuth(
      `Do you really want to delete ${compilation.name}?`,
      `Validate login before deleting: ${compilation.name}`,
    );
    if (!loginData) return;
    void this.#removeCompilation(compilation, loginData);
  }

  async multiRemoveCompilations() {
    const loginData = await this.#dialogHelper.confirmWithAuth(
      `Do you really want to delete these ${this.selectionService().selectedElements().length}?`,
      `Validate login before deleting.`,
    );
    if (!loginData) return;
    this.selectionService()
      .selectedElements()
      .forEach(compilation => {
        if (isCompilation(compilation)) {
          void this.#removeCompilation(compilation, loginData);
        }
      });

    this.selectionService().clearSelection();
  }

  async #removeCompilation(
    compilation: ICompilation,
    loginData: { username: string; password: string },
  ) {
    const { username, password } = loginData;

    if (this.permission.canDeleteCompletely(compilation)) {
      this.#backend
        .deleteRequest(compilation._id, 'compilation', username, password)
        .then(() => {
          this.#account.updateTrigger$.next(Collection.compilation);
        })
        .catch(e => console.error(e));
    } else {
      this.#backend
        .removeSelfFromAccess('compilation', compilation._id)
        .then(() => {
          this.#account.updateTrigger$.next(Collection.compilation);
        })
        .catch(e => console.error(e));
    }
  }

  //Selection

  isSelected(compilation: ICompilation): boolean {
    return this.selectionService().isSelected(compilation);
  }

  addCompilationToSelection(compilation: ICompilation, event: MouseEvent) {
    const allElements = this.filteredCompilations() ?? [];
    if (event.shiftKey) {
      this.selectionService().updateSelectionWithRange(compilation, allElements);
    } else {
      this.selectionService().updateSelection(compilation, event);
      this.selectionService().lastSelectedIndex.set(allElements.indexOf(compilation));
    }
  }

  changeSelectionOnCheckbox(compilation: ICompilation) {
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

    const user = this.#account.user();
    if (!user?._id) {
      this.#snackbar.showMessage('You must be logged in to select entities.', 5);
      return;
    }

    const compElementPairs =
      this.paginatorCompilations()?.map((element, index) => ({
        element,
        htmlElement: this.gridItems()[index].nativeElement as HTMLElement,
      })) || [];

    this.selectionService().selectElementsInRect(selectionRect, compElementPairs);
  }

  ngAfterViewInit() {
    this.actionsTemplateChange.emit(this.selectionActionsTpl());
  }
}
