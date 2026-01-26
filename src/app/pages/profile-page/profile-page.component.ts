import {
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { debounceTime } from 'rxjs';
import { SearchBarComponent } from 'src/app/components/search-bar/search-bar.component';
import { Tab, TabsComponent } from 'src/app/components/tabs/tabs.component';
import { TranslatePipe } from 'src/app/pipes';
import { AccountService, DialogHelperService } from 'src/app/services';
import { SidenavService } from 'src/app/services/sidenav.service';
import { ExploreFilterOption } from '../explore/explore-filter-option/explore-filter-option.component';
import { ExploreFilterSidenavToggleComponent } from '../explore/explore-filter-sidenav-toggle/explore-filter-sidenav-toggle.component';
import {
  ExploreFilterSidenavComponent,
  ExploreFilterSidenavData,
  ExploreFilterSidenavOptionsService,
} from '../explore/explore-filter-sidenav/explore-filter-sidenav.component';
import {
  AccessOptions,
  AnnotationOptions,
  AvailableSortByOptions,
  ExploreCategory,
  GroupRoleOptions,
  LicenceOptions,
  MediaTypeOptions,
  MiscOptions,
  SortByOptions,
} from '../explore/shared-types';
import { ProfileCompilationsComponent } from './compilations/compilations.component';
import { ProfileEntitiesComponent } from './entities/entities.component';
import { ProfileGroupsComponent } from './groups/groups.component';
import { ProfilePageHeaderComponent } from './profile-page-header/profile-page-header.component';
import { ProfilePageHelpComponent } from './profile-page-help.component';
import { DomPortal, PortalModule } from '@angular/cdk/portal';
import { NotificationService } from 'src/app/components/notification-area/notification-area.component';

@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss'],
  imports: [
    MatTooltipModule,
    MatButtonModule,
    MatIconModule,
    PortalModule,
    FormsModule,
    MatProgressSpinnerModule,
    TranslatePipe,
    ProfileEntitiesComponent,
    ProfileGroupsComponent,
    ProfileCompilationsComponent,
    ProfilePageHeaderComponent,
    TabsComponent,
    SearchBarComponent,
    ExploreFilterSidenavToggleComponent,
  ],
})
export class ProfilePageComponent implements OnInit {
  #account = inject(AccountService);
  #router = inject(Router);
  #notification = inject(NotificationService);
  #dialog = inject(MatDialog);
  #helper = inject(DialogHelperService);
  #titleService = inject(Title);
  #sidenavService = inject(SidenavService);
  #sidenavOptionsService = inject(ExploreFilterSidenavOptionsService);

  userData = toSignal(this.#account.user$);
  userProfile = toSignal(this.#account.userProfile$, { initialValue: undefined });

  groupComponentRef = viewChild(ProfileGroupsComponent);

  availableTabs = [
    { label: 'Objects', value: 'objects' },
    { label: 'Drafts', value: 'drafts' },
    { label: 'Collections', value: 'collections' },
    { label: 'Groups', value: 'groups' },
  ] as const satisfies Tab[];
  selectedTab = signal<string>('objects');

  searchText = signal<string>('');

  selectedFilterOptions = signal<ExploreFilterOption[]>([]);
  numFilterOptions = computed(
    () => this.selectedFilterOptions().filter(option => option.category !== 'sortBy').length,
  );

  constructor() {
    // Listen to sidenav option changes in the background, even while the sidenav is still opened
    let isInitialChange = true;
    effect(() => {
      const updatedOptions = this.#sidenavOptionsService.selectedOptions();
      console.log('Sidenav options updated in background:', updatedOptions, isInitialChange);

      if (isInitialChange) {
        isInitialChange = false;
        return;
      }

      this.selectedFilterOptions.set(updatedOptions);
    });
  }

  public async openFilterSidenav() {
    if (this.#sidenavService.state().opened) return;
    const tab = this.selectedTab();
    const category =
      ({
        objects: 'objects',
        drafts: 'objects',
        collections: 'collections',
      }[tab] as ExploreCategory) ?? 'objects';

    const filterOptions = (() => {
      if (tab === 'drafts') {
        return {
          sortBy: SortByOptions,
          mediaType: MediaTypeOptions,
        } satisfies ExploreFilterSidenavData['filterOptions'];
      }

      if (tab === 'groups') {
        return {
          // TODO: Does it even make sense to show this?
          sortBy: [
            { ...AvailableSortByOptions.name, default: true },
            AvailableSortByOptions.recency,
          ],
          groupRole: GroupRoleOptions,
        } satisfies ExploreFilterSidenavData['filterOptions'];
      }

      return {
        // TODO: Filter for private/public objects?
        sortBy: SortByOptions,
        mediaType: MediaTypeOptions,
        annotation: AnnotationOptions,
        // TODO: access object does not exist on collections yet
        access: tab === 'collections' ? [] : AccessOptions,
        licence: LicenceOptions,
        misc: MiscOptions,
      } satisfies ExploreFilterSidenavData['filterOptions'];
    })();

    const result = await this.#sidenavService.openWithResult<
      ExploreFilterOption[],
      ExploreFilterSidenavData
    >(ExploreFilterSidenavComponent, {
      options: this.selectedFilterOptions(),
      category,
      filterOptions,
    });
    if (result) {
      this.selectedFilterOptions.set(result);
    }
  }

  public icons = {
    audio: 'audiotrack',
    video: 'movie',
    image: 'image',
    model: 'language',
    collection: 'apps',
  };

  public openHelp() {
    this.#dialog.open(ProfilePageHelpComponent);
  }

  public openEditDialog() {
    this.#helper.editProfile(this.userProfile());
  }

  openGroupWizard() {
    this.groupComponentRef()?.openGroupCreation();
  }

  ngOnInit() {
    this.#titleService.setTitle('Kompakkt – Profile');

    this.#account.user$.pipe(debounceTime(5000)).subscribe(userdata => {
      if (!userdata) {
        // User is not logged in and not authenticated
        this.#notification.showNotification({
          message: 'You are not logged in or your session expired.',
          type: 'warn',
        });
        this.#router.navigate(['/']);
      }
    });
  }
}
