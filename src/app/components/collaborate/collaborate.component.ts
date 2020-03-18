import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { Router } from '@angular/router';

import { ConfirmationDialogComponent } from '../../dialogs/confirmation-dialog/confirmation-dialog.component';
import { GroupMemberDialogComponent } from '../../dialogs/group-member-dialog/group-member-dialog.component';
import { ICompilation, IEntity, IGroup, IUserData } from '../../interfaces';
import { AccountService } from '../../services/account.service';
import { DialogHelperService } from '../../services/dialog-helper.service';
import { BackendService } from '../../services/backend.service';
import { AddCompilationWizardComponent } from '../../wizards/add-compilation/add-compilation-wizard.component';
import { AddGroupWizardComponent } from '../../wizards/add-group-wizard/add-group-wizard.component';
import { AuthDialogComponent } from '../auth-dialog/auth-dialog.component';
import { Meta, Title } from '@angular/platform-browser';

@Component({
  selector: 'app-collaborate',
  templateUrl: './collaborate.component.html',
  styleUrls: ['./collaborate.component.scss'],
})
export class CollaborateComponent implements OnInit {
  public userData: IUserData | undefined;

  public filter = {
    public: true,
    private: false,
    restricted: false,
    unfinished: false,
  };
  public filteredEntities: IEntity[] = [];
  public filteredCompilations: ICompilation[] = [];
  public filteredGroups: IGroup[] = [];

  public showPartakingGroups = false;
  public showPartakingCompilations = false;

  private partakingGroups: IGroup[] = [];
  private partakingCompilations: ICompilation[] = [];

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

  public entitySearchInput = '';

  constructor(
    private account: AccountService,
    private dialog: MatDialog,
    private backend: BackendService,
    private router: Router,
    private dialogHelper: DialogHelperService,
    private titleService: Title,
    private metaService: Meta,
  ) {
    this.account.userDataObservable.subscribe(newData => {
      this.userData = newData;
      if (!this.userData) return;

      this.backend
        .findUserInGroups()
        .then(groups => (this.partakingGroups = groups))
        .catch(e => console.error(e));

      this.backend
        .findUserInCompilations()
        .then(compilations => (this.partakingCompilations = compilations))
        .catch(e => console.error(e));
    });
  }

  // Groups
  public getUserGroups = () =>
    this.userData && this.userData.data.group ? this.userData.data.group : [];

  public getPartakingGroups = () => this.partakingGroups;

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
    const dialogRef = this.dialog.open(GroupMemberDialogComponent, {
      data: group,
    });
  }

  public async removeGroupDialog(group: IGroup) {
    const confirmDialog = this.dialog.open(ConfirmationDialogComponent, {
      data: `Do you really want to delete ${group.name}?`,
    });
    // Get confirmation
    let result = await confirmDialog
      .afterClosed()
      .toPromise()
      .then(_r => _r);
    if (!result) return;

    // Get and cache login data
    if (!this.account.loginData.isCached) {
      const loginDialog = this.dialog.open(AuthDialogComponent, {
        data: `Validate login before deleting: ${group.name}`,
        disableClose: true,
      });
      result = await loginDialog
        .afterClosed()
        .toPromise()
        .then(_r => _r);
    }

    if (!result) return;

    // Delete
    if (this.account.loginData.isCached) {
      this.backend
        .deleteRequest(
          group._id,
          'group',
          this.account.loginData.username,
          this.account.loginData.password,
        )
        .then(result => {
          if (this.userData?.data?.group) {
            this.userData.data.group = (this.userData.data
              .group as IGroup[]).filter(_g => _g._id !== group._id);
          }
        })
        .catch(e => console.error(e));
    }
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
  public getUserCompilations = () =>
    this.userData && this.userData.data.compilation
      ? (this.userData.data.compilation as ICompilation[])
      : [];

  public getPartakingCompilations = () => this.partakingCompilations;

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
            const index = (this.userData.data
              .compilation as ICompilation[]).findIndex(
              comp => comp._id === result._id,
            );
            if (index === -1) return;
            this.userData.data.compilation.splice(index, 1, result);
          } else {
            (this.userData.data.compilation as ICompilation[]).push(result);
          }
        }
      });
  }

  public async removeCompilationDialog(compilation: ICompilation) {
    const confirmDialog = this.dialog.open(ConfirmationDialogComponent, {
      data: `Do you really want to delete ${compilation.name}?`,
    });
    // Get confirmation
    let result = await confirmDialog
      .afterClosed()
      .toPromise()
      .then(_r => _r);
    if (!result) return;

    // Get and cache login data
    if (!this.account.loginData.isCached) {
      const loginDialog = this.dialog.open(AuthDialogComponent, {
        data: `Validate login before deleting: ${compilation.name}`,
        disableClose: true,
      });
      result = await loginDialog
        .afterClosed()
        .toPromise()
        .then(_r => _r);
    }

    if (!result) return;

    // Delete
    if (this.account.loginData.isCached) {
      this.backend
        .deleteRequest(
          compilation._id,
          'compilation',
          this.account.loginData.username,
          this.account.loginData.password,
        )
        .then(result => {
          if (this.userData?.data?.compilation) {
            this.userData.data.compilation = (this.userData.data
              .compilation as ICompilation[]).filter(
              comp => comp._id !== compilation._id,
            );
          }
        })
        .catch(e => console.error(e));
    }
  }

  ngOnInit() {
    this.titleService.setTitle(`Kompakkt – Collaborate`);
    this.metaService.updateTag({
      name: 'description',
      content: 'Work collaboratively.',
    });
  }
}
