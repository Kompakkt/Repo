import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';

import {
  AccountService,
  BackendService,
  DialogHelperService,
} from '../../services';

import { ConfirmationDialogComponent } from '../../dialogs/confirmation-dialog/confirmation-dialog.component';
import { GroupMemberDialogComponent } from '../../dialogs/group-member-dialog/group-member-dialog.component';
import { ICompilation, IEntity, IGroup, IUserData } from 'src/common';
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

  public entitySearchInput = '';

  constructor(
    private account: AccountService,
    private dialog: MatDialog,
    private backend: BackendService,
    private titleService: Title,
    private metaService: Meta,
    private helper: DialogHelperService,
  ) {
    this.account.userData$.subscribe(newData => {
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
    });
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

    // Delete
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
      `Validate login before deleting ${compilation.name}`,
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

  ngOnInit() {
    this.titleService.setTitle(`Kompakkt – Collaborate`);
    this.metaService.updateTag({
      name: 'description',
      content: 'Work collaboratively.',
    });
  }
}
