import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent, MatPaginator } from '@angular/material/paginator';
import { ActivatedRoute } from '@angular/router';
import { combineLatest, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  isMetadataEntity,
  ICompilation,
  IEntity,
  IGroup,
  IUserData,
} from 'src/common';
import {
  AccountService,
  BackendService,
  DialogHelperService,
} from '../../services';
import { EntitySettingsDialogComponent } from '../../dialogs/entity-settings-dialog/entity-settings-dialog.component';
import { GroupMemberDialogComponent } from '../../dialogs/group-member-dialog/group-member-dialog.component';
import { ConfirmationDialogComponent } from '../../dialogs/confirmation-dialog/confirmation-dialog.component';
import { EntityRightsDialogComponent } from '../../dialogs/entity-rights-dialog/entity-rights-dialog.component';
import { AuthDialogComponent } from '../auth-dialog/auth-dialog.component';
import { AddGroupWizardComponent } from '../../wizards/add-group-wizard/add-group-wizard.component';
import { AddCompilationWizardComponent } from '../../wizards/add-compilation/add-compilation-wizard.component';
import { AddEntityWizardComponent } from '../../wizards/add-entity/add-entity-wizard.component';
import { ProfilePageHelpComponent } from './profile-page-help.component';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss'],
})
export class ProfilePageComponent implements OnInit {
  public userData: IUserData;

  public filter = {
    published: true,
    unpublished: false,
    restricted: false,
    unfinished: false,
  };

  public showPartakingGroups = false;
  public showPartakingCompilations = false;

  private __partakingGroups: IGroup[] = [];
  private __partakingCompilations: ICompilation[] = [];

  public icons = {
    audio: 'audiotrack',
    video: 'movie',
    image: 'image',
    model: 'language',
    collection: 'apps',
  };

  public pageEvent: PageEvent = {
    previousPageIndex: 0,
    pageIndex: 0,
    pageSize: 20,
    length: Number.POSITIVE_INFINITY,
  };

  private searchInput = new BehaviorSubject('');

  constructor(
    private account: AccountService,
    private dialog: MatDialog,
    private backend: BackendService,
    private helper: DialogHelperService,
    private titleService: Title,
    private route: ActivatedRoute,
  ) {
    this.userData = this.route.snapshot.data.userData;

    this.account.user$.subscribe(newData => {
      this.userData = newData;
      if (!this.userData) return;
      this.backend
        .findUserInGroups()
        .then(groups => (this.__partakingGroups = groups))
        .catch(e => console.error(e));

      this.backend
        .findUserInCompilations()
        .then(compilations => (this.__partakingCompilations = compilations))
        .catch(e => console.error(e));
      this.updateFilter();
    });
  }

  public changeEntitySearchText(event: Event, paginator: MatPaginator) {
    const value = (event.target as HTMLInputElement)?.value ?? '';
    this.searchInput.next(value.toLowerCase());
    paginator.firstPage();
  }

  get filteredEntities$() {
    const { published, unpublished, restricted, unfinished } = this.filter;
    return combineLatest([
      this.account.publishedEntities$,
      this.account.unpublishedEntities$,
      this.account.restrictedEntities$,
      this.account.unfinishedEntities$,
    ]).pipe(
      map(
        ([
          publishedEntities,
          unpublishedEntities,
          restrictedEntities,
          unfinishedEntities,
        ]) => {
          if (published) return publishedEntities;
          if (unpublished) return unpublishedEntities;
          if (restricted) return restrictedEntities;
          if (unfinished) return unfinishedEntities;
          return [];
        },
      ),
      map(entities => {
        this.pageEvent.length = entities.length;
        return entities;
      }),
    );
  }

  get paginatorEntities$() {
    const start = this.pageEvent.pageSize * this.pageEvent.pageIndex;
    const end = start + this.pageEvent.pageSize;
    return combineLatest([this.filteredEntities$, this.searchInput]).pipe(
      map(([arr, searchInput]) => {
        if (!searchInput) return arr;
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
  }

  public async updateFilter(property?: string, paginator?: MatPaginator) {
    // On radio button change
    if (property) {
      // Disable wrong filters
      for (const prop in this.filter) {
        (this.filter as any)[prop] = prop === property;
      }
    }

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
        // Replace old entity with new entity
        if (result && this.userData && this.userData.data.entity) {
          const index = (this.userData.data.entity as IEntity[]).findIndex(
            _en => result._id === _en._id,
          );
          if (index === -1) return;
          this.userData.data.entity.splice(index, 1, result as IEntity);
        }
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
        }
      });
  }

  public async removeEntity(entity: IEntity) {
    const loginData = await this.helper.confirmWithAuth(
      `Do you really want to delete ${entity.name}?`,
      `Validate login before deleting ${entity.name}`,
    );
    if (!loginData) return;
    const { username, password } = loginData;

    // Delete
    this.backend
      .deleteRequest(entity._id, 'entity', username, password)
      .then(result => {
        if (this.userData?.data?.entity) {
          this.userData.data.entity = (
            this.userData.data.entity as IEntity[]
          ).filter(_e => _e._id !== entity._id);
          this.updateFilter();
        }
      })
      .catch(e => console.error(e));
  }

  // Groups
  get userGroups(): IGroup[] {
    return this.userData?.data?.group ?? [];
  }

  get partakingGroups(): IGroup[] {
    return this.__partakingGroups;
  }

  public openGroupCreation(group?: IGroup) {
    const dialogRef = this.dialog.open(AddGroupWizardComponent, {
      data: group ? group : undefined,
      disableClose: true,
    });
    dialogRef
      .afterClosed()
      .toPromise()
      .then((result: undefined | IGroup) => {
        if (!result) return;
        if (!this.userData) return;
        // Add new group to list
        this.userData.data.group = this.userData.data.group
          ? [...this.userData.data.group, result]
          : [result];
      });
  }

  public openMemberList(group: IGroup) {
    this.dialog.open(GroupMemberDialogComponent, {
      data: group,
    });
  }

  public async removeGroupDialog(group: IGroup) {
    const loginData = await this.helper.confirmWithAuth(
      `Do you really want to delete ${group.name}?`,
      `Validate login before deleting ${group.name}`,
    );
    if (!loginData) return;
    const { username, password } = loginData;

    this.backend
      .deleteRequest(group._id, 'group', username, password)
      .then(result => {
        if (this.userData?.data?.group) {
          this.userData.data.group = (
            this.userData.data.group as IGroup[]
          ).filter(_g => _g._id !== group._id);
        }
      })
      .catch(e => console.error(e));
  }

  public leaveGroupDialog(group: IGroup) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: `Do you really want to leave ${group.name}?`,
    });
    dialogRef
      .afterClosed()
      .toPromise()
      .then(result => {
        if (result) {
          // TODO: leave
          console.log('Leave', group);
        }
      });
  }

  // Compilations
  get userCompilations(): ICompilation[] {
    return this.userData?.data?.compilation ?? [];
  }

  get partakingCompilations(): ICompilation[] {
    return this.__partakingCompilations;
  }

  public openCompilationCreation(compilation?: ICompilation) {
    const dialogRef = this.dialog.open(AddCompilationWizardComponent, {
      data: compilation ? compilation : undefined,
      disableClose: true,
    });
    dialogRef
      .afterClosed()
      .toPromise()
      .then((result: undefined | ICompilation) => {
        if (result && this.userData && this.userData.data.compilation) {
          if (compilation) {
            const index = (
              this.userData.data.compilation as ICompilation[]
            ).findIndex(comp => comp._id === result._id);
            if (index === -1) return;
            this.userData.data.compilation.splice(index, 1, result);
          } else {
            (this.userData.data.compilation as ICompilation[]).push(result);
          }
        }
      });
  }

  public async removeCompilationDialog(compilation: ICompilation) {
    const loginData = await this.helper.confirmWithAuth(
      `Do you really want to delete ${compilation.name}?`,
      `Validate login before deleting: ${compilation.name}`,
    );
    if (!loginData) return;
    const { username, password } = loginData;

    // Delete
    this.backend
      .deleteRequest(compilation._id, 'compilation', username, password)
      .then(result => {
        if (this.userData?.data?.compilation) {
          this.userData.data.compilation = (
            this.userData.data.compilation as ICompilation[]
          ).filter(comp => comp._id !== compilation._id);
        }
      })
      .catch(e => console.error(e));
  }

  public openHelp() {
    this.dialog.open(ProfilePageHelpComponent);
  }

  ngOnInit() {
    this.titleService.setTitle('Kompakkt – Profile');
  }
}
