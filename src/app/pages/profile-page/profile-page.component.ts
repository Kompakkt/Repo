import {
  Component,
  computed,
  effect,
  inject,
  OnInit,
  signal,
  TemplateRef,
} from '@angular/core';
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
import { AccountService, DialogHelperService, SnackbarService } from 'src/app/services';
import { ProfileCompilationsComponent } from './compilations/compilations.component';
import { ProfileEntitiesComponent } from './entities/entities.component';
import { ProfilePageHeaderComponent } from './profile-page-header/profile-page-header.component';
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
      console.log('ProfilePageComponent: params changed to', this.#routeParams());
    });

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

  userData = toSignal(this.#account.user$);
  userProfile = toSignal(this.#account.userProfile$, { initialValue: undefined });
  currentProfile = toSignal(this.#account.currentProfile$, { initialValue: undefined });

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

  public openEditDialog() {
    this.#helper.editProfile(this.userProfile());
  }

  public onChangeTab(value) {
    this.selectedTab.set(value);
    this.#selectionService.clearSelection();
  }

  public async openFilterSidenav() {
    if (this.#sidenavService.state().opened) return;
    const tab = this.selectedTab();
    const category: ExploreCategory =
      tab === 'collections' ? 'collections' : 'objects';

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
    this.#titleService.setTitle('Kompakkt – Profile');

    this.#account.user$.pipe(debounceTime(5000)).subscribe(userdata => {
      if (!userdata) {
        // User is not logged in and not authenticated
        this.#snackbar.showMessage('You are not logged in or your session expired.');
        this.#router.navigate(['/']);
      }
    });
  }
}
