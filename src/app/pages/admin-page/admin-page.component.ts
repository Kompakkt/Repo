import { Component, OnInit, viewChild } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { BehaviorSubject, combineLatest, combineLatestWith, map, startWith } from 'rxjs';
import { AccountService, BackendService, DialogHelperService } from 'src/app/services';
import { IUserData, ObjectId } from 'src/common';
import { AsyncPipe, DatePipe } from '@angular/common';
import { MatButton } from '@angular/material/button';
import { MatOption } from '@angular/material/core';
import { MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSelect } from '@angular/material/select';
import { MatTab, MatTabGroup } from '@angular/material/tabs';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatRadioModule } from '@angular/material/radio';

const getTimestampFromObjectId = (objectId: string) => {
  return new Date(parseInt(objectId.substring(0, 8), 16) * 1000);
};

const uniqueArrayByObjectId = <T extends { _id: string | ObjectId }>(array: T[]) => {
  return array.filter((value, index, self) => {
    return self.findIndex(t => t._id.toString() === value._id.toString()) === index;
  });
};

@Component({
  selector: 'app-admin-page',
  templateUrl: './admin-page.component.html',
  styleUrls: ['./admin-page.component.scss'],
  standalone: true,
  imports: [
    MatFormField,
    MatInput,
    MatChipsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatRadioModule,
    MatOption,
    MatSelect,
    MatButton,
    MatTabGroup,
    MatTab,
    AsyncPipe,
    TranslatePipe,
    DatePipe,
  ],
})
export class AdminPageComponent implements OnInit {
  public sort = viewChild(MatSort);
  public paginator = viewChild(MatPaginator);

  private fetchedData = false;

  public users$ = new BehaviorSubject<IUserData[]>([]);
  public selectedUser$ = new BehaviorSubject<IUserData | undefined>(undefined);

  public selectedRole$ = new BehaviorSubject<string>('user');
  public roleFilter$ = new BehaviorSubject<string>('all');

  public dataSource = new MatTableDataSource<IUserData & { createdAt: Date }>([]);

  private loginData?: { username: string; password: string };

  public displayedColumns: string[] = [
    'fullname',
    'username',
    'mail',
    'role',
    'createdAt',
    'actions',
  ];

  constructor(
    private account: AccountService,
    private backend: BackendService,
    private titleService: Title,
    private metaService: Meta,
    private helper: DialogHelperService,
  ) {
    combineLatest([this.account.isAuthenticated$, this.account.isAdmin$]).subscribe(
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

    await this.backend.getAllUsers(username, password).then(result => this.users$.next(result));
  }

  public updateFilter(filter: string, role = 'all') {
    const removedRoleFilter = filter.replace(/\s?role:\w+\s?/g, '');
    this.dataSource.filter = [removedRoleFilter.toLowerCase(), `role:${role}`]
      .filter(v => !!v)
      .join(' ');
    console.log('filter', this.dataSource.filter);
  }

  public changeSearchInput(event: Event) {
    this.updateFilter((event.target as HTMLInputElement).value?.toString() ?? '');
  }

  displayName(user: IUserData) {
    return user.fullname;
  }

  public async selectUser(user?: IUserData) {
    if (!user) return;

    const loginData = await this.getLoginData();
    if (!loginData) return;
    const { username, password } = loginData;

    user = await this.backend.getUser(username, password, user._id).then(result => result);

    if (!user) return;

    this.selectedUser$.next(user);
  }

  public async updateUserRole() {
    const selectedUser = this.selectedUser$.getValue();
    if (!selectedUser) return;
    const selectedRole = this.selectedRole$.getValue();

    const loginData = await this.getLoginData();
    if (!loginData) return;
    const { username, password } = loginData;

    await this.backend
      .promoteUser(username, password, selectedUser._id, selectedRole)
      .then(result => console.log(result));

    const user = await this.backend
      .getUser(username, password, selectedUser._id)
      .then(result => result);

    if (!user) return;

    this.selectedUser$.next(user);
  }

  get entities$() {
    return this.selectedUser$.pipe(
      map(user => user?.data?.entity ?? []),
      map(arr => uniqueArrayByObjectId(arr)),
    );
  }

  get compilations$() {
    return this.selectedUser$.pipe(
      map(user => user?.data?.compilation ?? []),
      map(arr => uniqueArrayByObjectId(arr)),
    );
  }

  get tags$() {
    return this.selectedUser$.pipe(
      map(user => user?.data?.tag ?? []),
      map(arr => uniqueArrayByObjectId(arr)),
    );
  }

  get persons$() {
    return this.selectedUser$.pipe(
      map(user => user?.data?.person ?? []),
      map(arr => uniqueArrayByObjectId(arr)),
    );
  }

  get institutions$() {
    return this.selectedUser$.pipe(
      map(user => user?.data?.institution ?? []),
      map(arr => uniqueArrayByObjectId(arr)),
    );
  }

  get annotations$() {
    return this.selectedUser$.pipe(
      map(user => user?.data?.annotation ?? []),
      map(arr => uniqueArrayByObjectId(arr)),
    );
  }

  get groups$() {
    return this.selectedUser$.pipe(
      map(user => user?.data?.group ?? []),
      map(arr => uniqueArrayByObjectId(arr)),
    );
  }

  get metadata$() {
    return this.selectedUser$.pipe(
      map(user => user?.data?.digitalentity ?? []),
      map(arr => uniqueArrayByObjectId(arr)),
    );
  }

  ngOnInit() {
    this.titleService.setTitle('Kompakkt – Admin');
    this.metaService.updateTag({ name: 'description', content: 'Admin area.' });

    this.dataSource.filterPredicate = (user, filter) => {
      const words = filter.split(/\s+/).filter(word => word.length > 0);
      const role = words.find(word => word.startsWith('role:'))?.replace('role:', '');
      if (role && role !== 'all' && user.role !== role) return false;
      const pattern = words
        .filter(word => !word.startsWith('role:'))
        .map(word => `(${word})`)
        .join('.*');
      const regex = new RegExp(pattern, 'i');
      return regex.test([user.fullname, user.username, user.mail].join(' '));
    };

    this.roleFilter$.subscribe(role => {
      this.updateFilter(this.dataSource.filter, role);
    });

    this.users$.pipe(map(arr => uniqueArrayByObjectId(arr))).subscribe(users => {
      const sort = this.sort();
      if (sort) {
        this.dataSource.sort = sort;
      }
      const paginator = this.paginator();
      if (paginator) this.dataSource.paginator = paginator;
      const withDate = users.map(user => ({
        ...user,
        createdAt: getTimestampFromObjectId(user._id.toString()),
      }));
      this.dataSource.data = withDate;
    });
  }
}
