import { Component, computed, effect, inject, OnInit, signal, TemplateRef } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime, map } from 'rxjs';
import { SearchBarComponent } from 'src/app/components/search-bar/search-bar.component';
import { Tab, TabsComponent } from 'src/app/components/tabs/tabs.component';
import { TranslatePipe } from 'src/app/pipes';
import {
  AccountService,
  BackendService,
  DialogHelperService,
  SnackbarService,
} from 'src/app/services';
import { isPublicProfile, type IPublicProfile } from '@kompakkt/common';
import { ProfileCompilationsComponent } from './compilations/compilations.component';
import { ProfileEntitiesComponent } from './entities/entities.component';
import { ProfilePageHeaderComponent } from './profile-page-header/profile-page-header.component';
import { ProfilePublicViewComponent } from './public-view/profile-public-view.component';
import { ProfilePageHelpComponent } from './profile-page-help.component';
import { MatIconModule } from '@angular/material/icon';
import { SelectionTab } from 'src/app/components/selection/selection-tab/selection-tab.component';
import { SelectionService } from 'src/app/services/selection.service';
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
  ExploreCategory,
  LicenceOptions,
  MediaTypeOptions,
  MiscOptions,
  SortByOptions,
} from '../explore/shared-types';

@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss'],
  imports: [
    MatChipsModule,
    MatTooltipModule,
    MatRadioModule,
    MatCardModule,
    MatButtonModule,
    MatDividerModule,
    MatSlideToggleModule,
    FormsModule,
    MatProgressSpinnerModule,
    TranslatePipe,
    ProfileEntitiesComponent,
    ProfileCompilationsComponent,
    ProfilePageHeaderComponent,
    ProfilePublicViewComponent,
    TabsComponent,
    SearchBarComponent,
    SelectionTab,
    ExploreFilterSidenavToggleComponent,
    MatIconModule,
  ],
})
export class ProfilePageComponent implements OnInit {
  #account = inject(AccountService);
  #router = inject(Router);
  #activatedRoute = inject(ActivatedRoute);
  #snackbar = inject(SnackbarService);
  #dialog = inject(MatDialog);
  #helper = inject(DialogHelperService);
  #titleService = inject(Title);
  #selectionService = inject(SelectionService);
  #sidenavService = inject(SidenavService);
  #sidenavOptionsService = inject(ExploreFilterSidenavOptionsService);

  selectedFilterOptions = signal<ExploreFilterOption[]>([]);
  numFilterOptions = computed(
    () => this.selectedFilterOptions().filter(option => option.category !== 'sortBy').length,
  );

  #routeParams = toSignal(
    this.#activatedRoute.paramMap.pipe(
      map(params => ({
        id: params.get('id'),
        type: params.get('type'),
      })),
    ),
    { initialValue: { id: null, type: null } },
  );

  constructor() {
    effect(() => {
      const params = this.#routeParams();
      if (!params.id || params.id === this.currentProfile()?._id) {
        this.viewedProfile.set(undefined);
        return;
      }
      this.#backend
        .getProfileById(params.id)
        .then(profile => {
          this.viewedProfile.set(isPublicProfile(profile) ? profile : undefined);
        })
        .catch(() => this.viewedProfile.set(undefined));
    });

    let isInitialChange = true;
    effect(() => {
      const updatedOptions = this.#sidenavOptionsService.selectedOptions();
      if (isInitialChange) {
        isInitialChange = false;
        return;
      }
      this.selectedFilterOptions.set(updatedOptions);
    });

    effect(() => {
      const name = this.displayedProfile()?.displayName;
      this.#titleService.setTitle(name ? `Kompakkt – ${name}` : 'Kompakkt – Profile');
    });
  }

  userData = toSignal(this.#account.user$);
  userProfile = toSignal(this.#account.userProfile$, { initialValue: undefined });
  currentProfile = toSignal(this.#account.currentProfile$, { initialValue: undefined });

  viewedProfile = signal<IPublicProfile | undefined>(undefined);

  isForeignProfileView = computed(() => {
    const params = this.#routeParams();
    if (!params.id) return false;
    return params.id !== this.currentProfile()?._id;
  });

  displayedProfile = computed(() => {
    const params = this.#routeParams();
    const currentProfile = this.currentProfile();
    if (!params.id || params.id === currentProfile?._id) return currentProfile;
    return this.viewedProfile();
  });

  #backend = inject(BackendService);

  availableTabs = [
    { label: 'Objects', value: 'objects' },
    { label: 'Drafts', value: 'drafts' },
    { label: 'Collections', value: 'collections' },
  ] as const satisfies Tab[];
  selectedTab = signal<string>('objects');

  searchText = signal<string>('');

  currentActionsTemplate = signal<TemplateRef<unknown> | null>(null);

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

  public openEditDialog(profile?: IPublicProfile) {
    this.#helper.editProfile(profile ?? this.userProfile());
  }

  public isOwnProfile(profile: IPublicProfile): boolean {
    return profile._id === this.currentProfile()?._id;
  }

  public onChangeTab(value) {
    this.selectedTab.set(value);
    this.#selectionService.clearSelection();
  }

  public async openFilterSidenav() {
    if (this.#sidenavService.state().opened) return;
    const tab = this.selectedTab();
    const category: ExploreCategory = tab === 'collections' ? 'collections' : 'objects';

    const filterOptions =
      tab === 'drafts'
        ? ({
            sortBy: SortByOptions,
            mediaType: MediaTypeOptions,
            annotation: [],
            access: [],
            licence: [],
            misc: [],
          } satisfies ExploreFilterSidenavData['filterOptions'])
        : tab === 'collections'
          ? ({
              sortBy: SortByOptions,
              mediaType: [],
              annotation: AnnotationOptions,
              access: AccessOptions,
              licence: LicenceOptions,
              misc: MiscOptions,
            } satisfies ExploreFilterSidenavData['filterOptions'])
          : ({
              sortBy: SortByOptions,
              mediaType: MediaTypeOptions,
              annotation: AnnotationOptions,
              access: AccessOptions,
              licence: LicenceOptions,
              misc: MiscOptions,
            } satisfies ExploreFilterSidenavData['filterOptions']);

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

  ngOnInit() {
    this.#account.user$.pipe(debounceTime(5000)).subscribe(userdata => {
      if (userdata) return;
      if (this.#routeParams().id) return;
      this.#snackbar.showMessage('You are not logged in or your session expired.');
      this.#router.navigate(['/']).catch(() => {});
    });
  }
}
