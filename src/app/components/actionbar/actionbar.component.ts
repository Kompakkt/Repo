import { filter, firstValueFrom, map, of, shareReplay, switchMap, tap } from 'rxjs';

import { Component, computed, EventEmitter, input, Output, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AsyncPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  AccountService,
  AllowAnnotatingService,
  BackendService,
  DetailPageHelperService,
  DialogHelperService,
  QuickAddService,
  SelectHistoryService,
  SnackbarService,
} from 'src/app/services';
import { SortOrder } from 'src/app/services/backend.service';
import {
  ICompilation,
  IEntity,
  isAnnotation,
  isCompilation,
  isDigitalEntity,
  isEntity,
  UserRank,
} from 'src/common';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-actionbar',
  templateUrl: './actionbar.component.html',
  styleUrls: ['./actionbar.component.scss'],
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatTooltipModule,
    MatIconModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggle,
    MatSelectModule,
    MatAutocompleteModule,
    ReactiveFormsModule,
    MatOptionModule,
    RouterLink,
    MatMenuModule,
    AsyncPipe,
    TranslatePipe,
  ],
})
export class ActionbarComponent {
  showFilters = input(false);
  showAnnotateButton = input(false);
  showEditButton = input(false);
  showUsesInCollection = input(false);
  public showCompilations = false;
  public searchText = '';

  // TODO: add types to EventEmitters
  @Output() searchTextChange = new EventEmitter();
  @Output() showCompilationsChange = new EventEmitter();
  @Output() mediaTypesChange = new EventEmitter();
  @Output() filterTypesChange = new EventEmitter();
  @Output() sortOrderChange = new EventEmitter();

  @Output()
  public newElementSelected = new EventEmitter<undefined | IEntity | ICompilation>();

  inputElement = input<IEntity | ICompilation>(undefined, { alias: 'element' });
  updatedElement = signal<IEntity | ICompilation | undefined>(undefined);
  element = computed(() => {
    const inputElement = this.inputElement();
    const updatedElement = this.updatedElement();
    return updatedElement ?? inputElement;
  });
  isEntity = computed(() => isEntity(this.element()));
  isCompilation = computed(() => isCompilation(this.element()));

  isAnnotateUrl$ = this.activatedRoute.url.pipe(map(url => url.at(0)?.path === 'annotate'));

  metadataDownload = computed(() => {
    const element = this.element();
    if (!isEntity(element) && !isCompilation(element)) return;
    const url = this.sanitizer.bypassSecurityTrustUrl(
      `data:text/json;charset=UTF-8,${encodeURIComponent(JSON.stringify(element))}`,
    );
    const title = (() => {
      if (isCompilation(element)) {
        return `compilation-${element.name}`;
      } else {
        const title = isDigitalEntity(element?.relatedDigitalEntity)
          ? element.relatedDigitalEntity.title
          : element?.name;
        return `entity-${title}`;
      }
    })()
      .replace(/[^a-z0-9]/gi, '-')
      .toLowerCase();
    return {
      url: url as SafeUrl,
      title: `${title}.json`,
    };
  });

  element$ = toObservable(this.element);
  entityDownloadOptions$ = this.element$.pipe(
    filter(element => isEntity(element)),
    switchMap(element =>
      element.options?.allowDownload
        ? this.backend.getEntityDownloadStats(element._id)
        : of(undefined),
    ),
    shareReplay(1),
  );
  isDownloadable = toSignal(this.entityDownloadOptions$.pipe(map(options => !!options)), {
    initialValue: false,
  });

  public searchTextSuggestions = input<string[]>([]);

  public mediaTypesOptions = [
    {
      name: '3D Models',
      enabled: true,
      value: 'model',
    },
    {
      name: 'Audio',
      enabled: true,
      value: 'audio',
    },
    {
      name: 'Video',
      enabled: true,
      value: 'video',
    },
    {
      name: 'Image',
      enabled: true,
      value: 'image',
    },
  ];

  public mediaTypesSelected = new FormControl(
    this.mediaTypesOptions.filter(el => el.enabled).map(el => el.value),
  );

  public filterTypesOptions = [
    {
      enabled: false,
      name: 'Annotatable',
      value: 'annotatable',
      help: 'Only show entities you are allowed to annotate',
      onlyOnEntity: false,
    },
    {
      enabled: false,
      name: 'Annotated',
      value: 'annotated',
      help: 'Only show entities that have been annotated',
      onlyOnEntity: false,
    },
    {
      enabled: false,
      name: 'Restricted',
      value: 'restricted',
      help: 'Only show entities that are not public, but where you have access',
      onlyOnEntity: false,
    },
    {
      enabled: false,
      name: 'Associated',
      value: 'associated',
      help: 'Only show entities where you are mentioned in metadata',
      onlyOnEntity: true,
    },
  ];

  public filterTypesSelected = new FormControl(
    this.filterTypesOptions.filter(el => el.enabled).map(el => el.value),
  );

  public sortOrderOptions = [
    {
      name: 'Popularity',
      value: SortOrder.popularity,
      help: 'Sort by most visited',
    },
    {
      name: 'Usage',
      value: SortOrder.usage,
      help: 'Sort by amount of compilations containing an object',
    },
    {
      name: 'Name',
      value: SortOrder.name,
      help: 'Sort alphabetically',
    },
    {
      name: 'Annotations',
      value: SortOrder.annotations,
      help: 'Sort by number of annotations on an object',
    },
    {
      name: 'Newest',
      value: SortOrder.newest,
      help: 'Sort by creation date',
    },
  ];
  public sortOrderSelected = new FormControl(SortOrder.popularity);

  public filteredResults: Array<IEntity | ICompilation> = [];
  public selectedElement: IEntity | ICompilation | undefined;

  public icons = {
    audio: 'audiotrack',
    video: 'movie',
    image: 'image',
    model: 'language',
    collection: 'apps',
  };

  public searchOffset = 0;
  public paginatorLength = Number.POSITIVE_INFINITY;
  public paginatorPageSize = 20;
  public paginatorPageIndex = 0;

  constructor(
    private account: AccountService,
    private allowAnnotatingHelper: AllowAnnotatingService,
    private backend: BackendService,
    private detailPageHelper: DetailPageHelperService,
    private dialogHelper: DialogHelperService,
    private quickAdd: QuickAddService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private sanitizer: DomSanitizer,
    public selectHistory: SelectHistoryService,
    private snackbar: SnackbarService,
  ) {
    this.element$.subscribe(element => {
      console.debug('Actionbar element$', element);
    });

    this.entityDownloadOptions$.subscribe(options => {
      console.debug('EntityDownloadOptions', options);
    });
  }

  isAuthenticated$ = this.account.isAuthenticated$;

  userCompilations$ = this.account.compilations$.pipe(
    map(compilations => compilations.filter(isCompilation)),
  );

  public quickAddToCompilation(comp: ICompilation) {
    const element = this.element();
    if (!element) return;
    if (!isEntity(element)) return;
    this.quickAdd.quickAddToCompilation(comp, element._id.toString());
  }

  public openCompilationWizard() {
    const element = this.element();
    if (!element) return;
    if (isCompilation(element)) return;
    this.dialogHelper.openCompilationWizard(element);
  }

  /**
   * Display whether the current entity has been recently
   * annotated in a compilation
   * */
  public isRecentlyAnnotated(compilation: ICompilation) {
    const element = this.element();
    if (!element) return false;
    if (!isEntity(element)) return false;
    for (const id in compilation.annotations) {
      const anno = compilation.annotations[id];
      if (!isAnnotation(anno)) continue;
      if (anno.target.source.relatedEntity !== element._id) continue;
      const date = new Date(parseInt(anno._id.toString().slice(0, 8), 16) * 1000).getTime();
      if (date >= Date.now() - 86400000) return true;
    }
    return false;
  }

  public isAnnotatedInCompilation(compilation: ICompilation) {
    const element = this.element();
    if (!element) return false;
    if (!isEntity(element)) return false;
    for (const id in compilation.annotations) {
      const anno = compilation.annotations[id];
      if (!isAnnotation(anno)) continue;
      if (anno?.target?.source?.relatedEntity === element._id) return true;
    }
    return false;
  }

  #isAnnotatingAllowed$ = this.element$.pipe(
    tap(element => console.log('isAnnotatingAllowed$ element', element)),
    filter(element => !!element),
    switchMap(element => {
      console.log({
        element,
        isEntity: isEntity(element),
        isCompilation: isCompilation(element),
      });
      if (isEntity(element)) {
        return this.allowAnnotatingHelper.isUserOwner(element);
      }
      if (isCompilation(element)) {
        return Promise.all([
          this.allowAnnotatingHelper.isUserOwner(element),
          this.allowAnnotatingHelper.isElementPublic(element),
          this.allowAnnotatingHelper.isUserWhitelisted(element),
        ]).then(arr => arr.some(Boolean));
      }
      return of(false);
    }),
    tap(isAllowed => console.log('isAnnotatingAllowed$ isAllowed', isAllowed)),
  );
  isAnnotatingAllowed = toSignal(this.#isAnnotatingAllowed$);

  #isEditingAllowed$ = this.element$.pipe(
    filter(element => !!element),
    switchMap(element => this.allowAnnotatingHelper.isUserOwner(element)),
  );
  isEditingAllowed = toSignal(this.#isEditingAllowed$);

  annotateLink = computed(() => {
    const element = this.element();
    return element
      ? isEntity(element)
        ? ['/annotate', 'entity', element._id]
        : ['/annotate', 'compilation', element._id]
      : ['/explore'];
  });
  detailPageLink = computed(() => {
    const element = this.element();
    return element
      ? isEntity(element)
        ? ['/entity', element._id]
        : ['/compilation', element._id]
      : ['/explore'];
  });

  public navigate(element: IEntity | ICompilation) {
    return this.router.navigateByUrl(
      `/${isEntity(element) ? 'entity' : 'compilation'}/${element._id}`,
    );
  }

  isUploader$ = this.account.userData$.pipe(
    map(userData => userData?.role === UserRank.admin || userData?.role === UserRank.uploader),
  );

  hasRequestedUpload$ = this.account.userData$.pipe(
    map(userData => userData?.role === UserRank.uploadrequested),
  );

  public toggleSlide() {
    this.showCompilations = !this.showCompilations;
    this.showCompilationsChange.emit(this.showCompilations);
  }

  public searchTextChanged() {
    this.searchTextChange.emit(this.searchText);
  }

  public updateMediaTypeOptions(event: MatSelectChange) {
    const enabledList = event.source.value as string[];
    this.mediaTypesOptions.forEach(el => (el.enabled = enabledList.includes(el.value)));
    this.mediaTypesChange.emit(this.mediaTypesSelected.value);
  }

  public updateFilterTypeOptions(event: MatSelectChange) {
    const enabledList = event.source.value as string[];
    this.filterTypesOptions.forEach(el => (el.enabled = enabledList.includes(el.value)));
    this.filterTypesChange.emit(this.filterTypesSelected.value);
  }

  public updateSortOrderOptions(event: MatSelectChange) {
    this.sortOrderChange.emit(event.value);
  }

  get filterTypeOptions() {
    return this.filterTypesOptions.filter(el => (this.showCompilations ? !el.onlyOnEntity : true));
  }

  public openLoginDialog() {
    this.dialogHelper.openLoginDialog();
  }

  public openRegisterDialog() {
    this.dialogHelper.openRegisterDialog();
  }

  public editSettingsInViewer() {
    const element = this.element();
    if (!isEntity(element)) return;
    this.dialogHelper.editSettingsInViewer(element);
  }

  public editMetadata() {
    const element = this.element();
    if (!isEntity(element)) return;
    this.dialogHelper.editMetadata(element);
  }

  public editVisibility() {
    const element = this.element();
    if (!isEntity(element)) return;
    this.dialogHelper.editVisibilityAndAccess(element);
  }

  public editCompilation() {
    const element = this.element();
    if (!isCompilation(element)) return;
    this.dialogHelper.editCompilation(element);
  }

  isPublished = computed(() => {
    const element = this.element();
    if (!isEntity(element)) return false;
    return !!element.online;
  });

  public async togglePublished() {
    const element = this.element();
    if (!isEntity(element)) return;
    this.backend
      .pushEntity({ ...element, online: !element.online })
      .then(result => {
        console.log('Toggled?:', result);
        if (isEntity(result)) this.updatedElement.set(result);
      })
      .catch(error => console.error(error));
  }

  public copyEmbed() {
    let embedHTML: string;
    const iframe = document.querySelector('.iframe-container > iframe') as
      | HTMLIFrameElement
      | undefined;

    if (!iframe) return this.snackbar.showMessage('Could not find viewer');

    const element = this.element();
    if (!element) return this.snackbar.showMessage('Could not find element');
    if (isCompilation(element)) {
      embedHTML = iframe.outerHTML;
    } else {
      const title = isDigitalEntity(element?.relatedDigitalEntity)
        ? element.relatedDigitalEntity.title
        : element?.name;
      embedHTML = `
      <iframe
        name="${title}"
        src="${iframe.src}"
        allowfullscreen
        loading="lazy"
      ></iframe>`.trim();
    }

    this.detailPageHelper.copyEmbed(embedHTML);
  }

  public copyId() {
    const element = this.element();
    if (!element) return this.snackbar.showMessage('Could not find element');
    const _id = element?._id;
    if (!_id) return this.snackbar.showMessage('Could not copy id');

    this.detailPageHelper.copyID(_id.toString() ?? '');
  }

  public async openDownloadDialog() {
    const options = await firstValueFrom(this.entityDownloadOptions$);
    if (!options) {
      this.snackbar.showMessage('No download options available for this entity');
      return;
    }

    const element = this.element();
    if (!element || !isEntity(element)) {
      this.snackbar.showMessage('No entity selected for download');
      return;
    }

    if (!element.options?.allowDownload) {
      this.snackbar.showMessage('Download not allowed for this entity');
      return;
    }

    this.dialogHelper.openEntityDownloadDialog(element, options);
  }
}
