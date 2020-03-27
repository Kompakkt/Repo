import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';

import { AccountService } from '../../services/account.service';
import { BackendService } from '../../services/backend.service';
import { IUserData } from '@kompakkt/shared';
import { AuthDialogComponent } from '../auth-dialog/auth-dialog.component';
import { Meta, Title } from '@angular/platform-browser';

@Component({
  selector: 'app-admin-page',
  templateUrl: './admin-page.component.html',
  styleUrls: ['./admin-page.component.scss'],
})
export class AdminPageComponent implements OnInit {
  private fetchedData = false;

  public users: IUserData[] = [];
  public selectedUser: IUserData | undefined;

  public selectedRole = 'user';

  public userSearchInput = '';

  constructor(
    private account: AccountService,
    private backend: BackendService,
    private dialog: MatDialog,
    private titleService: Title,
    private metaService: Meta,
  ) {
    this.account.userData$.subscribe(() => {
      if (!this.fetchedData) {
        this.fetchAdminData();
      }
    });
  }

  get isAdmin() {
    return this.account.isUserAdmin;
  }

  private async fetchAdminData() {
    this.fetchedData = true;

    let result = true;
    // Get and cache login data
    if (!this.account.loginData.isCached) {
      const loginDialog = this.dialog.open(AuthDialogComponent, {
        data: `Validate login before receiving admin data`,
        disableClose: true,
      });
      result = await loginDialog
        .afterClosed()
        .toPromise()
        .then(_r => _r);
    }

    if (!result) {
      this.fetchedData = false;
      return;
    }

    await this.backend
      .getAllUsers(
        this.account.loginData.username,
        this.account.loginData.password,
      )
      .then(result => (this.users = result));
  }

  public changeSearchInput = (event: Event) => {
    const value = (event.target as HTMLInputElement).value;
    if (!value) return;
    this.userSearchInput = value.toLowerCase();
  };

  displayName(user: IUserData) {
    return user.fullname;
  }

  public async userSelected(event: MatAutocompleteSelectedEvent) {
    let user: IUserData = event.option.value;
    if (!user) return;

    let result = true;
    // Get and cache login data
    if (!this.account.loginData.isCached) {
      const loginDialog = this.dialog.open(AuthDialogComponent, {
        data: `Validate login before receiving admin data`,
        disableClose: true,
      });
      result = await loginDialog
        .afterClosed()
        .toPromise()
        .then(_r => _r);
    }

    if (!result) {
      return;
    }

    user = await this.backend
      .getUser(
        this.account.loginData.username,
        this.account.loginData.password,
        user._id,
      )
      .then(result => result);

    if (!user) return;

    this.selectedUser = user;
  }

  public async updateUserRole() {
    console.log(this.selectedRole);
    let result = true;
    // Get and cache login data
    if (!this.account.loginData.isCached) {
      const loginDialog = this.dialog.open(AuthDialogComponent, {
        data: `Validate login before receiving admin data`,
        disableClose: true,
      });
      result = await loginDialog
        .afterClosed()
        .toPromise()
        .then(_r => _r);
    }

    if (!result || !this.selectedUser) {
      return;
    }

    await this.backend
      .promoteUser(
        this.account.loginData.username,
        this.account.loginData.password,
        this.selectedUser._id,
        this.selectedRole,
      )
      .then(result => console.log(result));

    const user = await this.backend
      .getUser(
        this.account.loginData.username,
        this.account.loginData.password,
        this.selectedUser._id,
      )
      .then(result => result);

    if (!user) return;

    this.selectedUser = user;
  }

  get entities() {
    return this.selectedUser &&
      this.selectedUser.data &&
      this.selectedUser.data.entity
      ? this.selectedUser.data.entity
      : [];
  }
  get compilations() {
    return this.selectedUser &&
      this.selectedUser.data &&
      this.selectedUser.data.compilation
      ? this.selectedUser.data.compilation
      : [];
  }
  get tags() {
    return this.selectedUser &&
      this.selectedUser.data &&
      this.selectedUser.data.tag
      ? this.selectedUser.data.tag
      : [];
  }
  get persons() {
    return this.selectedUser &&
      this.selectedUser.data &&
      this.selectedUser.data.person
      ? this.selectedUser.data.person
      : [];
  }
  get institutions() {
    return this.selectedUser &&
      this.selectedUser.data &&
      this.selectedUser.data.institution
      ? this.selectedUser.data.institution
      : [];
  }
  get annotations() {
    return this.selectedUser &&
      this.selectedUser.data &&
      this.selectedUser.data.annotation
      ? this.selectedUser.data.annotation
      : [];
  }
  get groups() {
    return this.selectedUser &&
      this.selectedUser.data &&
      this.selectedUser.data.group
      ? this.selectedUser.data.group
      : [];
  }
  get metadata() {
    return this.selectedUser &&
      this.selectedUser.data &&
      this.selectedUser.data.digitalentity
      ? this.selectedUser.data.digitalentity
      : [];
  }

  get autocompleteUsers() {
    return this.users.filter(_u =>
      this.userSearchInput === ''
        ? true
        : _u.fullname.toLowerCase().includes(this.userSearchInput),
    );
  }

  ngOnInit() {
    this.titleService.setTitle(`Kompakkt – Admin`);
    this.metaService.updateTag({ name: 'description', content: 'Admin area.' });
  }
}
