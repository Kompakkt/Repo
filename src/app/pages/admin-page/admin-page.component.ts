import { Component, OnInit } from '@angular/core';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { Meta, Title } from '@angular/platform-browser';
import { BehaviorSubject, combineLatest, map } from 'rxjs';
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

@Component({
  selector: 'app-admin-page',
  templateUrl: './admin-page.component.html',
  styleUrls: ['./admin-page.component.scss'],
})
export class AdminPageComponent implements OnInit {
  private fetchedData = false;

  public users$ = new BehaviorSubject<IUserData[]>([]);
  public roleFilter$ = new BehaviorSubject<string>('all');

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

    const users = await this.backend.getAllUsers(username, password);
    this.users$.next(users.sort((a, b) => a.fullname.localeCompare(b.fullname)));
  }

  public changeSearchInput = (event: Event) => {
    const value = (event.target as HTMLInputElement).value;
    this.userSearchInput = value.toLowerCase();
  };

  displayName(user: IUserData) {
    return `${user.fullname} - ${user.mail}`;
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

  get filteredUsers$() {
    return combineLatest([this.users$, this.roleFilter$]).pipe(
      map(([users, roleFilter]) =>
        roleFilter === 'all' ? users : users.filter(user => user.role === roleFilter),
      ),
      map(users =>
        this.userSearchInput === ''
          ? users
          : users.filter(u =>
              u.fullname.toLowerCase().includes(this.userSearchInput.toLowerCase()),
            ),
      ),
    );
  }

  get shouldPromoteSelectedUser() {
    return this.selectedUser?.role === 'user' || this.selectedUser?.role === 'uploadrequested';
  }

  get shouldDemoteSelectedUser() {
    return this.selectedUser?.role === 'uploader';
  }

  private async changeUserRoleTo(role: 'uploader' | 'user') {
    if (!this.selectedUser) return;

    const loginData = await this.getLoginData();
    if (!loginData) return;
    const { username, password } = loginData;
    const { _id } = this.selectedUser;

    await this.backend
      .promoteUser(username, password, _id, role)
      .then(result => console.log(result));

    const user = await this.backend.getUser(username, password, _id).then(result => result);
    if (!user) return;
    this.selectedUser = user;

    // Replace changed user
    const users = this.users$.getValue();
    const index = users.findIndex(other => user._id === other._id);
    users.splice(index, 1, user);
    this.users$.next(users);
  }

  public async promoteSelectedUser() {
    this.changeUserRoleTo('uploader');
  }

  public demoteSelectedUser() {
    this.changeUserRoleTo('user');
  }

  ngOnInit() {
    this.titleService.setTitle('Kompakkt – Admin');
    this.metaService.updateTag({ name: 'description', content: 'Admin area.' });
  }
}
