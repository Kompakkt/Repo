import { DatePipe, JsonPipe } from '@angular/common';
import {
  Component,
  effect,
  OnInit,
  signal,
  viewChild,
  inject,
  resource,
  computed,
  input,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatOptionModule, provideNativeDateAdapter } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { Meta, Title } from '@angular/platform-browser';
import {
  areDocumentsEqual,
  IDocument,
  isAnnotation,
  isCompilation,
  isDigitalEntity,
  isEntity,
  isInstitution,
  isPerson,
  isTag,
  isUserRank,
  IUserData,
} from '@kompakkt/common';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { Endpoint, Response } from '@kompakkt/server-openapi';
import { scrollToMainContent } from 'src/app/util/scroll-to-main-content';
import { RedirectCommand, ResourceContext, ResourceResult, Router } from '@angular/router';
import { AuthDialogResult } from 'src/app/dialogs/auth-dialog/auth-dialog.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { GridElementComponent } from 'src/app/components/grid-element/grid-element.component';
import { AccountService } from 'src/app/services/account.service';
import { BackendService } from 'src/app/services/backend.service';
import { DialogHelperService } from 'src/app/services/dialog-helper.service';

const getTimestampFromObjectId = (objectId: string) => {
  return new Date(parseInt(objectId.substring(0, 8), 16) * 1000);
};

const uniqueArrayByObjectId = <T extends string | IDocument | null>(array: T[]) => {
  return array.filter((value, index, self) => {
    return self.findIndex(t => areDocumentsEqual(t, value)) === index;
  });
};

type ReturnedUsersArray = Response<Endpoint<'post', '/server/admin/getusers'>>;
type ReturnedUser = ReturnedUsersArray[number];

export const adminPageResource = (_: ResourceContext): ResourceResult | Promise<ResourceResult> => {
  const router = inject(Router);
  const helper = inject(DialogHelperService);
  return {
    loginData: resource({
      loader: async () => {
        const data = helper.verifyAuthentication('Validate login before receiving admin data');
        if (!data) {
          throw new RedirectCommand(router.parseUrl('/404'));
        }
        return data;
      },
    }),
  };
};

@Component({
  selector: 'app-admin-page',
  templateUrl: './admin-page.component.html',
  styleUrls: ['./admin-page.component.scss'],
  imports: [
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatChipsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatRadioModule,
    MatOptionModule,
    MatSelectModule,
    MatButtonModule,
    MatTabsModule,
    GridElementComponent,
    TranslatePipe,
    DatePipe,
    JsonPipe,
  ],
  providers: [provideNativeDateAdapter()],
})
export class AdminPageComponent implements OnInit {
  account = inject(AccountService);
  #backend = inject(BackendService);
  #titleService = inject(Title);
  #metaService = inject(Meta);

  sort = viewChild(MatSort);
  paginator = viewChild(MatPaginator);

  selectedRole = signal('user');
  roleFilter = signal('all');

  dataSource = new MatTableDataSource<ReturnedUser & { createdAt: Date }>([]);

  onPageChange() {
    scrollToMainContent();
  }

  yearOptions = signal(
    (() => {
      const firstYear = 2019;
      const lastYear = new Date().getFullYear();
      const years: number[] = [];
      for (let year = firstYear; year <= lastYear; year++) years.push(year);
      return years;
    })(),
  );
  monthOptions = signal(
    (() => {
      // Return as names derived from Date locale
      const monthNames: string[] = [];
      for (let month = 0; month < 12; month++) {
        const date = new Date(2000, month, 1);
        monthNames.push(date.toLocaleString('default', { month: 'long' }));
      }
      return monthNames;
    })(),
  );

  currentYear = new Date().getFullYear();
  currentMonth = new Date().getMonth();

  // Due to a bug with FormFields and the Angular Material mat-select and mat-checkbox, these can't be turned into a form yet
  selectedYear = signal<number | undefined>(this.currentYear);
  selectedMonth = signal<number | undefined>(this.currentMonth);
  onlyRestricted = signal<boolean | undefined>(false);
  onlyFinished = signal<boolean | undefined>(false);
  setMonthAndYear(date: Date) {
    this.selectedYear.set(date.getFullYear());
    this.selectedMonth.set(date.getMonth());
  }

  displayedColumns: string[] = ['fullname', 'username', 'mail', 'role', 'createdAt', 'actions'];

  loginData = input.required<AuthDialogResult>();

  #usersResource = resource({
    params: () => this.loginData(),
    loader: ({ params: { username, password } }) => this.#backend.getAllUsers(username, password),
  });
  #digestResource = resource({
    params: () => {
      const loginData = this.loginData();
      const year = this.selectedYear() ?? new Date().getFullYear();
      const month = this.selectedMonth() ?? new Date().getMonth();
      const finished = this.onlyFinished() ?? false;
      const restricted = this.onlyRestricted() ?? false;
      // Get start and end of the current month
      const from = new Date(year, month, 1).getTime();
      const to = new Date(year, month + 1, 0, 23, 59, 59, 999).getTime();
      const digestOptions = { finished, restricted, from, to };
      return { ...loginData, digestOptions };
    },
    loader: ({ params: { username, password, digestOptions } }) =>
      this.#backend.getDigest(username, password, digestOptions),
  });
  digestEntities = computed(() => {
    const digest = this.#digestResource.hasValue() ? this.#digestResource.value() : undefined;
    return digest;
  });

  selectedUserId = signal<string | undefined>(undefined);
  #selectedUserResource = resource({
    params: () => {
      const loginData = this.loginData();
      const userId = this.selectedUserId();
      if (!userId) return undefined;
      return { ...loginData, userId };
    },
    loader: ({ params: { username, password, userId } }) =>
      this.#backend.getUser(username, password, userId),
  });
  selectedUser = computed(() => {
    const user = this.#selectedUserResource.hasValue()
      ? this.#selectedUserResource.value()
      : undefined;
    return user;
  });

  updateFilter(filter: string, role = 'all') {
    const removedRoleFilter = filter.replace(/\s?role:\w+\s?/g, '');
    this.dataSource.filter = [removedRoleFilter.toLowerCase(), `role:${role}`]
      .filter(v => !!v)
      .join(' ');
    console.log('filter', this.dataSource.filter);
  }

  changeSearchInput(event: Event) {
    this.updateFilter((event.target as HTMLInputElement).value?.toString() ?? '');
  }

  displayName(user: IUserData) {
    return user.fullname;
  }

  async updateUserRole() {
    const loginData = this.loginData();
    const selectedUser = this.#selectedUserResource.hasValue()
      ? this.#selectedUserResource.value()
      : undefined;
    if (!selectedUser) return;
    const selectedRole = this.selectedRole();

    const { username, password } = loginData;

    if (!isUserRank(selectedRole)) return;

    await this.#backend
      .promoteUser(username, password, selectedUser._id, selectedRole)
      .then(result => console.log(result));

    const user = await this.#backend
      .getUser(username, password, selectedUser._id)
      .then(result => result);

    if (!user) return;
    this.#selectedUserResource.reload();
  }

  entities = computed(() => {
    const selectedUser = this.#selectedUserResource.hasValue()
      ? this.#selectedUserResource.value()
      : undefined;
    if (!selectedUser) return undefined;
    return uniqueArrayByObjectId(selectedUser?.data?.entity?.filter(isEntity) ?? []);
  });

  compilations = computed(() => {
    const selectedUser = this.#selectedUserResource.hasValue()
      ? this.#selectedUserResource.value()
      : undefined;
    if (!selectedUser) return undefined;
    return uniqueArrayByObjectId(selectedUser?.data?.compilation?.filter(isCompilation) ?? []);
  });

  tags = computed(() => {
    const selectedUser = this.#selectedUserResource.hasValue()
      ? this.#selectedUserResource.value()
      : undefined;
    if (!selectedUser) return undefined;
    return uniqueArrayByObjectId(selectedUser?.data?.tag?.filter(isTag) ?? []);
  });

  persons = computed(() => {
    const selectedUser = this.#selectedUserResource.hasValue()
      ? this.#selectedUserResource.value()
      : undefined;
    if (!selectedUser) return undefined;
    return uniqueArrayByObjectId(selectedUser?.data?.person?.filter(isPerson) ?? []);
  });

  institutions = computed(() => {
    const selectedUser = this.#selectedUserResource.hasValue()
      ? this.#selectedUserResource.value()
      : undefined;
    if (!selectedUser) return undefined;
    return uniqueArrayByObjectId(selectedUser?.data?.institution?.filter(isInstitution) ?? []);
  });

  annotations = computed(() => {
    const selectedUser = this.#selectedUserResource.hasValue()
      ? this.#selectedUserResource.value()
      : undefined;
    if (!selectedUser) return undefined;
    return uniqueArrayByObjectId(selectedUser?.data?.annotation?.filter(isAnnotation) ?? []);
  });

  metadata = computed(() => {
    const selectedUser = this.#selectedUserResource.hasValue()
      ? this.#selectedUserResource.value()
      : undefined;
    if (!selectedUser) return undefined;
    return uniqueArrayByObjectId(selectedUser?.data?.digitalentity?.filter(isDigitalEntity) ?? []);
  });

  constructor() {
    effect(() => {
      const role = this.roleFilter();
      this.updateFilter(this.dataSource.filter, role);
    });

    effect(() => {
      const users = this.#usersResource.hasValue() ? this.#usersResource.value() : undefined;
      if (!users) return;
      const unique = uniqueArrayByObjectId(users);
      const sort = this.sort();
      if (sort) {
        this.dataSource.sort = sort;
      }
      const paginator = this.paginator();
      if (paginator) this.dataSource.paginator = paginator;
      const withDate = unique
        .map(user =>
          user._id
            ? {
                ...user,
                createdAt: getTimestampFromObjectId(user._id.toString()),
              }
            : undefined,
        )
        .filter(user => user !== undefined);
      this.dataSource.data = withDate;
    });
  }

  ngOnInit() {
    this.#titleService.setTitle('Kompakkt – Admin');
    this.#metaService.updateTag({ name: 'description', content: 'Admin area.' });

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
  }
}
