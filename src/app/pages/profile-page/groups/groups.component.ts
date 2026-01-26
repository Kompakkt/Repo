import { AsyncPipe } from '@angular/common';
import { Component, inject, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltip, MatTooltipModule } from '@angular/material/tooltip';
import DeepClone from 'rfdc';
import { combineLatest, filter, firstValueFrom, map, merge, switchMap } from 'rxjs';
import { GridElementComponent } from 'src/app/components';
import { ConfirmationDialogComponent, GroupMemberDialogComponent } from 'src/app/dialogs';
import { TranslatePipe } from 'src/app/pipes';
import { AccountService, BackendService, DialogHelperService } from 'src/app/services';
import { AddGroupWizardComponent } from 'src/app/wizards';
import { Collection, IGroup } from 'src/common';
import { ExploreFilterOption } from '../../explore/explore-filter-option/explore-filter-option.component';
import { reduceExploreFilterOptions, SortOrder } from '../../explore/shared-types';
import {
  Pagination,
  PaginationComponent,
} from 'src/app/components/pagination/pagination.component';
const deepClone = DeepClone({ circles: true });

const timestampFromObjectId = (_id: string): number => {
  const date = new Date(parseInt(_id.toString().slice(0, 8), 16) * 1000).getTime();
  return date;
};

@Component({
  selector: 'app-profile-groups',
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.scss'],
  standalone: true,
  imports: [
    MatChipsModule,
    MatMenuModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTooltipModule,
    MatDividerModule,
    MatSlideToggleModule,
    FormsModule,
    TranslatePipe,
    AsyncPipe,
    GridElementComponent,
    PaginationComponent,
  ],
})
export class ProfileGroupsComponent {
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

  #refresh$ = merge(
    this.#account.user$,
    this.#account.updateTrigger$.pipe(filter(t => t === Collection.group)),
  );

  #userGroups$ = this.#refresh$.pipe(switchMap(() => this.#backend.findUserInGroups()));
  user = toSignal(this.#account.user$);

  constructor() {
    this.filteredGroups$.subscribe(groups => {
      this.paginator.update(paginator => ({
        ...paginator,
        pageIndex: 0,
        pageCount: Math.ceil(groups.length / paginator.pageSize),
        totalItemCount: groups.length,
      }));
    });
  }

  filteredGroups$ = combineLatest([
    this.#userGroups$,
    this.searchText$.pipe(map(text => text.trim().toLowerCase())),
    this.selectedFilterOptions$.pipe(map(options => reduceExploreFilterOptions(options))),
  ]).pipe(
    map(([groups, searchText, filterOptions]) => {
      const sortOrder = (filterOptions.sortBy as SortOrder[])?.at(0);
      return groups
        .filter(group => {
          if (filterOptions.groupRole) {
            const { isOwner, isCreator, isMember } = this.#getUserGroupStatus(group);
            const joined = filterOptions.groupRole.join('');
            if (joined.includes('owner') && !isOwner) return false;
            if (joined.includes('creator') && !isCreator) return false;
            if (joined.includes('member') && !isMember) return false;
          }

          if (searchText.length > 0) {
            let content = group.name;
            content += group.creator.fullname;
            group.members.forEach(member => {
              content += member.fullname;
            });
            group.owners.forEach(owner => {
              content += owner.fullname;
            });
            const hasSearchText = content.toLowerCase().includes(searchText);
            if (!hasSearchText) return false;
          }

          return true;
        })
        .sort((a, b) => {
          if (!sortOrder) return 0;
          switch (sortOrder) {
            case SortOrder.name: {
              return a.name.localeCompare(b.name);
            }
            case SortOrder.newest: {
              return timestampFromObjectId(b._id) - timestampFromObjectId(a._id);
            }
            default: {
              return a.name.localeCompare(b.name);
            }
          }
        });
    }),
  );

  #getUserGroupStatus(group: IGroup): { isOwner: boolean; isCreator: boolean; isMember: boolean } {
    const currentUser = this.user();
    if (!currentUser) return { isOwner: false, isCreator: false, isMember: false };

    const isOwner = group.owners.some(owner => owner._id === currentUser._id);
    const isMember = group.members.some(member => member._id === currentUser._id);
    const isCreator = group.creator._id === currentUser._id;

    return { isOwner, isCreator, isMember };
  }

  public selfIsLastOwner(group: IGroup): boolean {
    const { isOwner } = this.#getUserGroupStatus(group);
    return isOwner && group.owners.length === 1;
  }

  public userCanEdit(group: IGroup): boolean {
    const { isOwner, isCreator } = this.#getUserGroupStatus(group);
    return isOwner || isCreator;
  }

  public openGroupCreation(group?: IGroup) {
    const dialogRef = this.#dialog.open(AddGroupWizardComponent, {
      data: group ? deepClone(group) : undefined,
      disableClose: true,
    });
    dialogRef
      .afterClosed()
      .toPromise()
      .then((result: undefined | IGroup) => {
        this.#account.updateTrigger$.next(Collection.group);
      });
  }

  public openMemberList(group: IGroup) {
    this.#dialog.open(GroupMemberDialogComponent, {
      data: group,
    });
  }

  public async removeGroupDialog(group: IGroup) {
    const loginData = await this.#helper.confirmWithAuth(
      `Do you really want to delete ${group.name}?`,
      `Validate login before deleting ${group.name}`,
    );
    if (!loginData) return;
    const { username, password } = loginData;

    this.#backend
      .deleteRequest(group._id, 'group', username, password)
      .then(result => {
        this.#account.updateTrigger$.next(Collection.group);
      })
      .catch(e => console.error(e));
  }

  public async leaveGroupDialog(group: IGroup) {
    const dialogRef = this.#dialog.open(ConfirmationDialogComponent, {
      data: `Do you really want to leave ${group.name}?`,
    });

    const response = await firstValueFrom(dialogRef.afterClosed());
    if (!response) return;

    this.#backend.leaveGroup(group._id).then(result => {
      console.log('Left', group);
      this.#account.updateTrigger$.next(Collection.group);
    });
  }
}
