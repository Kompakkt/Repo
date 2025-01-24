import { Component, OnInit } from '@angular/core';
import {
  MatAutocomplete,
  MatAutocompleteSelectedEvent,
  MatAutocompleteTrigger,
} from '@angular/material/autocomplete';
import { Meta, Title } from '@angular/platform-browser';
import { combineLatest } from 'rxjs';

import { AccountService, BackendService, DialogHelperService } from 'src/app/services';
import {
  IAnnotation,
  ICompilation,
  IDigitalEntity,
  IEntity,
  IGroup,
  IInstitution,
  IPerson,
  ITag,
  IUserData,
} from 'src/common';

import { AsyncPipe } from '@angular/common';
import { MatButton } from '@angular/material/button';
import { MatOption } from '@angular/material/core';
import { MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSelect } from '@angular/material/select';
import { MatTab, MatTabGroup } from '@angular/material/tabs';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
    selector: 'app-admin-page',
    templateUrl: './admin-page.component.html',
    styleUrls: ['./admin-page.component.scss'],
    imports: [
        MatFormField,
        MatInput,
        MatAutocompleteTrigger,
        MatAutocomplete,
        MatOption,
        MatSelect,
        MatButton,
        MatTabGroup,
        MatTab,
        AsyncPipe,
        TranslatePipe,
    ]
})
export class AdminPageComponent implements OnInit {
  private fetchedData = false;

  public users: IUserData[] = [];
  public selectedUser: IUserData | undefined;

  public selectedRole = 'user';

  public userSearchInput = '';

  private loginData?: { username: string; password: string };

  constructor(
    private account: AccountService,
    private backend: BackendService,
    private titleService: Title,
    private metaService: Meta,
    private helper: DialogHelperService,
  ) {
    combineLatest(this.account.isAuthenticated$, this.account.isAdmin$).subscribe(
      ([authenticated, admin]) => {
        if (!authenticated) {
          console.error('User is not authenticated');
        } else if (!admin) {
          console.error('User is not an admin');
        } else {
          this.fetchAdminData();
        }
      },
    );
  }

  get isAdmin$() {
    return this.account.isAdmin$;
  }

  private async getLoginData() {
    console.log('loginData', this.loginData);
    if (!this.loginData) {
      const loginData = await this.helper.verifyAuthentication(
        'Validate login before receiving admin data',
      );
      this.loginData = loginData;
    }
    return this.loginData;
  }

  private async fetchAdminData() {
    if (this.fetchedData) return;
    this.fetchedData = true;

    const loginData = await this.getLoginData();
    if (!loginData) {
      this.fetchedData = false;
      return;
    }
    const { username, password } = loginData;

    await this.backend.getAllUsers(username, password).then(result => (this.users = result));
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

    const loginData = await this.getLoginData();
    if (!loginData) return;
    const { username, password } = loginData;

    user = await this.backend.getUser(username, password, user._id).then(result => result);

    if (!user) return;

    this.selectedUser = user;
  }

  public async updateUserRole() {
    if (!this.selectedUser) return;
    console.log(this.selectedRole);

    const loginData = await this.getLoginData();
    if (!loginData) return;
    const { username, password } = loginData;

    await this.backend
      .promoteUser(username, password, this.selectedUser._id, this.selectedRole)
      .then(result => console.log(result));

    const user = await this.backend
      .getUser(username, password, this.selectedUser._id)
      .then(result => result);

    if (!user) return;

    this.selectedUser = user;
  }

  get entities(): IEntity[] {
    return this.selectedUser?.data?.entity ?? [];
  }

  get compilations(): ICompilation[] {
    return this.selectedUser?.data?.compilation ?? [];
  }

  get tags(): ITag[] {
    return this.selectedUser?.data?.tag ?? [];
  }

  get persons(): IPerson[] {
    return this.selectedUser?.data?.person ?? [];
  }

  get institutions(): IInstitution[] {
    return this.selectedUser?.data?.institution ?? [];
  }

  get annotations(): IAnnotation[] {
    return this.selectedUser?.data?.annotation ?? [];
  }

  get groups(): IGroup[] {
    return this.selectedUser?.data?.group ?? [];
  }

  get metadata(): IDigitalEntity[] {
    return this.selectedUser?.data?.digitalentity ?? [];
  }

  get autocompleteUsers() {
    return this.users.filter(_u =>
      this.userSearchInput === '' ? true : _u.fullname.toLowerCase().includes(this.userSearchInput),
    );
  }

  ngOnInit() {
    this.titleService.setTitle('Kompakkt – Admin');
    this.metaService.updateTag({ name: 'description', content: 'Admin area.' });
  }
}
