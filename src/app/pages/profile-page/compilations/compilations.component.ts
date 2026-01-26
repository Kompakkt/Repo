import { AsyncPipe } from '@angular/common';
import { Component, inject, input, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { RouterLink } from '@angular/router';
import { combineLatest, map, switchMap } from 'rxjs';
import { GridElementComponent } from 'src/app/components/grid-element/grid-element.component';
import { TranslatePipe } from 'src/app/pipes';
import { AccountService, BackendService, DialogHelperService } from 'src/app/services';
import { CacheManagerService } from 'src/app/services/cache-manager.service';
import { AddCompilationWizardComponent } from 'src/app/wizards';
import { Collection, ICompilation, isCompilation } from 'src/common';
import { ExploreFilterOption } from '../../explore/explore-filter-option/explore-filter-option.component';
import {
  Pagination,
  PaginationComponent,
} from 'src/app/components/pagination/pagination.component';
import {
  AvailableAnnotationOptions,
  AvailableMiscOptions,
  reduceExploreFilterOptions,
  SortOrder,
} from '../../explore/shared-types';

const getAnnotationCount = (compilation: ICompilation): number => {
  if (compilation.__annotationCount !== undefined) {
    return compilation.__annotationCount;
  }
  return Object.keys(compilation.annotations || {}).length;
};

@Component({
  selector: 'app-profile-compilations',
  templateUrl: './compilations.component.html',
  styleUrls: ['./compilations.component.scss'],
  standalone: true,
  imports: [
    MatChipsModule,
    GridElementComponent,
    PaginationComponent,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    RouterLink,
    MatDividerModule,
    MatSlideToggleModule,
    FormsModule,
    TranslatePipe,
    AsyncPipe,
  ],
})
export class ProfileCompilationsComponent {
  #cache = inject(CacheManagerService);
  #account = inject(AccountService);
  #dialog = inject(MatDialog);
  #backend = inject(BackendService);
  #helper = inject(DialogHelperService);

  selectedFilterOptions = input<ExploreFilterOption[]>([]);
  selectedFilterOptions$ = toObservable(this.selectedFilterOptions);
  searchText = input<string>('');
  searchText$ = toObservable(this.searchText);

  public paginator = signal<Pagination>({
    pageCount: Number.POSITIVE_INFINITY,
    pageSize: 24,
    totalItemCount: -1,
    pageIndex: 0,
  });
  #paginator$ = toObservable(this.paginator);

  constructor() {}

  userCompilations$ = this.#account.compilationsWithEntities$.pipe(
    map(compilations => compilations.filter(c => isCompilation(c))),
  );

  partakingCompilations$ = this.#account.user$.pipe(
    switchMap(() =>
      this.#cache.getItem<ICompilation[]>('profile-partaking-compilations', () =>
        this.#backend.findUserInCompilations(),
      ),
    ),
  );

  combinedCompilations$ = combineLatest([this.userCompilations$, this.partakingCompilations$]).pipe(
    map(([userCompilations, partakingCompilations]) => {
      const compilationMap = new Map<string, ICompilation & { isUserOwner?: boolean }>();
      // TODO: Once access field is enabled, we need to fetch collections differently
      partakingCompilations?.forEach(c => compilationMap.set(c._id, c));
      userCompilations.forEach(c => compilationMap.set(c._id, { ...c, isUserOwner: true }));
      return Array.from(compilationMap.values());
    }),
  );

  isCombinedCompilationsEmpty$ = this.combinedCompilations$.pipe(
    map(compilations => compilations.length === 0),
  );

  filteredCompilations$ = combineLatest([
    this.#account.user$,
    this.combinedCompilations$,
    this.searchText$.pipe(map(text => text.trim().toLowerCase())),
    this.selectedFilterOptions$.pipe(map(options => reduceExploreFilterOptions(options))),
  ]).pipe(
    map(([userdata, compilations, searchText, filterOptions]) => {
      const sortOrder = (filterOptions.sortBy as SortOrder[])?.at(0);
      return compilations
        .filter(c => {
          if (filterOptions.mediaType) {
            const hasMediaType = filterOptions.mediaType!.some(o => c.__mediaTypes?.includes(o));
            if (!hasMediaType) return false;
          }

          if (filterOptions.annotation) {
            const onlyWithAnnotations = filterOptions.annotation.includes(
              AvailableAnnotationOptions.withAnnotations.value,
            );
            const onlyWithoutAnnotations = filterOptions.annotation.includes(
              AvailableAnnotationOptions.withoutAnnotations.value,
            );

            const count = getAnnotationCount(c);
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

            const userAccess = c.access?.[userdata._id]?.role;
            if (!userAccess || !selectedRoles.includes(userAccess)) return false;
          }

          if (filterOptions.misc) {
            const miscOptions = filterOptions.misc;

            if (miscOptions.includes(AvailableMiscOptions.downloadable.value) && !c.__downloadable)
              return false;
          }

          if (filterOptions.licence) {
            const selectedLicences = filterOptions.licence;
            if (!c.__licenses || !selectedLicences.some(l => c.__licenses?.includes(l)))
              return false;
          }

          if (searchText.length > 0) {
            const content = (c.__normalizedName || c.name) + c.description;
            if (!content.toLowerCase().includes(searchText)) {
              return false;
            }
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

  paginatorCompilations$ = combineLatest([this.filteredCompilations$, this.#paginator$]).pipe(
    map(([compilations, { pageSize, pageIndex }]) => {
      const start = pageSize * pageIndex;
      return compilations.slice(start, start + pageSize);
    }),
  );

  public openCompilationCreation(compilation?: ICompilation) {
    const dialogRef = this.#dialog.open(AddCompilationWizardComponent, {
      data: compilation,
      disableClose: true,
    });
    dialogRef
      .afterClosed()
      .toPromise()
      .then((result: undefined | ICompilation) => {
        this.#account.updateTrigger$.next(Collection.compilation);
      });
  }

  public async removeCompilationDialog(compilation: ICompilation) {
    const loginData = await this.#helper.confirmWithAuth(
      `Do you really want to delete ${compilation.name}?`,
      `Validate login before deleting: ${compilation.name}`,
    );
    if (!loginData) return;
    const { username, password } = loginData;

    // Delete
    this.#backend
      .deleteRequest(compilation._id, 'compilation', username, password)
      .then(result => {
        this.#account.updateTrigger$.next(Collection.compilation);
      })
      .catch(e => console.error(e));
  }
}
