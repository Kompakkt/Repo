import { filter, firstValueFrom, map, of, shareReplay, switchMap, tap } from 'rxjs';

import {
  Component,
  computed,
  inject,
  input,
  signal,
  viewChild,
  ChangeDetectionStrategy,
  resource,
} from '@angular/core';
import { MatSelectModule } from '@angular/material/select';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  ICompilation,
  IEntity,
  isAnnotation,
  isCompilation,
  isDigitalEntity,
  isEntity,
} from '@kompakkt/common';
import { IsCompilationPipe } from 'src/app/pipes/is-compilation.pipe';
import { IsEntityPipe } from 'src/app/pipes/is-entity.pipe';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OverlayModule } from '@angular/cdk/overlay';
import { PermissionService } from 'src/app/services/permissions.service';
import { AccountService } from 'src/app/services/account.service';
import { BackendService } from 'src/app/services/backend.service';
import { DialogHelperService } from 'src/app/services/dialog-helper.service';
import { SnackbarService } from 'src/app/services/snackbar.service';
import { SelectHistoryService } from 'src/app/services/select-history.service';

@Component({
  selector: 'app-actionbar',
  templateUrl: './actionbar.component.html',
  styleUrls: ['./actionbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatTooltipModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    MatOptionModule,
    OverlayModule,
    RouterLink,
    MatMenuModule,
    TranslatePipe,
    IsCompilationPipe,
    IsEntityPipe,
  ],
})
export class ActionbarComponent {
  #backend = inject(BackendService);
  #dialogHelper = inject(DialogHelperService);
  #router = inject(Router);
  #sanitizer = inject(DomSanitizer);
  #snackbar = inject(SnackbarService);
  #permission = inject(PermissionService);
  selectHistory = inject(SelectHistoryService);
  account = inject(AccountService);

  parentPage = input.required<'detail-page' | 'annotate-page'>();
  isDetailPage = computed(() => this.parentPage() === 'detail-page');
  isAnnotatePage = computed(() => this.parentPage() === 'annotate-page');

  inputElement = input<IEntity | ICompilation>(undefined, { alias: 'element' });
  updatedElement = signal<IEntity | ICompilation | undefined>(undefined);
  element = computed(() => {
    const inputElement = this.inputElement();
    const updatedElement = this.updatedElement();
    return updatedElement ?? inputElement;
  });
  isEntity = computed(() => isEntity(this.element()));
  isCompilation = computed(() => isCompilation(this.element()));
  isFinished = computed(() => {
    const element = this.element();
    if (isEntity(element)) {
      return element.finished;
    } else if (isCompilation(element)) {
      return Object.keys(element.entities).length > 0;
    }
  });

  showUsesInCollection = computed(() => this.isEntity() && this.isDetailPage());

  compilationDescription = computed(() => {
    const element = this.element();
    return isCompilation(element) ? element.description : '';
  });

  entityCount = computed(() => {
    const element = this.element();
    return isCompilation(element) && element.entities ? Object.keys(element.entities).length : 0;
  });

  metadataDownload = computed(() => {
    const element = this.element();
    if (!isEntity(element) && !isCompilation(element)) return;
    const url = this.#sanitizer.bypassSecurityTrustUrl(
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

  #entityDownloadOptionsResource = resource({
    params: () => {
      const element = this.element();
      if (!element) return undefined;
      if (!('options' in element)) return undefined;
      if (!element.options?.allowDownload) return undefined;
      return { _id: element._id.toString() };
    },
    loader: ({ params }) => this.#backend.getEntityDownloadStats(params._id),
  });

  isDownloadable = computed(() => {
    const element = this.element();
    if (!isEntity(element)) return false;
    if (!('options' in element)) return false;
    if (!element.options?.allowDownload) return false;
    if (!this.#entityDownloadOptionsResource.hasValue()) return false;
    return true;
  });

  readonly infoMenuTrigger = viewChild<MatMenuTrigger>('infoMenuTrigger');

  quickAddToCompilation() {
    const element = this.element();
    if (!element) return;
    if (!isEntity(element)) return;
    this.#dialogHelper.addToCompilation([element]);
  }

  openRemoveCompilationDialog(compilation: ICompilation) {
    this.#dialogHelper.removeFromCompilation(compilation);
  }

  /**
   * Display whether the current entity has been recently
   * annotated in a compilation
   * */
  isRecentlyAnnotated(compilation: ICompilation) {
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

  isAnnotatedInCompilation(compilation: ICompilation) {
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

  canEditAnnotation = computed(() => {
    const element = this.element();
    return element ? this.#permission.canEditAnnotation(element) : false;
  });

  canEditEntitySettings = computed(() => {
    const element = this.element();
    return element ? this.#permission.canEditEntitySettings(element) : false;
  });

  canEditMetadata = computed(() => {
    const element = this.element();
    return element ? this.#permission.canEditMetaData(element) : false;
  });

  canEditVisibilityAndAccess = computed(() => {
    const element = this.element();
    return element ? this.#permission.canEditVisibilityAndAccess(element) : false;
  });

  canViewVisibilityAndAccess = computed(() => {
    const element = this.element();
    return element ? this.#permission.canViewVisibilityAndAccess(element) : false;
  });

  canRemoveObjects = computed(() => {
    const element = this.element();
    return element ? this.#permission.canEditCompilationObjects(element) : false;
  });

  canTransferOwnership = computed(() => {
    const element = this.element();
    return element ? this.#permission.canTransferOwnership(element) : false;
  });

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

  navigate(element: IEntity | ICompilation) {
    return this.#router.navigateByUrl(
      `/${isEntity(element) ? 'entity' : 'compilation'}/${element._id}`,
    );
  }

  openLoginDialog() {
    this.#dialogHelper.openLoginDialog();
  }

  openRegisterDialog() {
    this.#dialogHelper.openRegisterDialog();
  }

  editSettingsInViewer() {
    const element = this.element();
    if (!isEntity(element)) return;
    this.#dialogHelper.editSettingsInViewer(element);
  }

  editMetadata() {
    const element = this.element();
    if (isEntity(element)) {
      return this.#dialogHelper.editEntity(element);
    } else if (isCompilation(element)) {
      return this.#dialogHelper.createOrEditCompilation(element);
    }
  }

  editVisibility() {
    const element = this.element();
    if (!element) return;

    const ref = this.#dialogHelper.editVisibilityAndAccess([element] as IEntity[] | ICompilation[]);

    ref.afterClosed().subscribe(result => {
      if (!result) return;
      const updated = Array.isArray(result) ? result[0] : result;

      if (isEntity(updated)) {
        this.updatedElement.set(updated);
      }
    });
  }

  openTransferOwnerDialog() {
    const element = this.element();
    if (!element) return;
    return this.#dialogHelper.openTransferOwnershipDialog(element);
  }

  openEmbedDialog() {
    const element = this.element();
    if (!element) return;
    return this.#dialogHelper.openEmbedDialog(element);
  }

  isPublished = computed(() => {
    const element = this.element();
    return element && 'online' in element ? !!element.online : false;
  });

  isUpdatingPublishState = signal(false);
  async togglePublished() {
    this.isUpdatingPublishState.set(true);
    const element = this.element();
    if (isEntity(element)) {
      await this.#backend
        .pushEntity({ ...element, online: !element.online })
        .then(result => {
          console.log('Toggled?:', result);
          if (isEntity(result)) this.updatedElement.set(result);
        })
        .catch(error => console.error(error));
    } else if (isCompilation(element)) {
      await this.#backend
        .pushCompilation({ ...element, online: !element.online })
        .then(result => {
          console.log('Toggled?:', result);
          if (isCompilation(result)) this.updatedElement.set(result);
        })
        .catch(error => console.error(error));
    }
    this.isUpdatingPublishState.set(false);
  }

  closeInfoMenu() {
    this.infoMenuTrigger()?.closeMenu();
  }

  openDownloadDialog() {
    if (!this.#entityDownloadOptionsResource.hasValue())
      return this.#snackbar.showMessage('Download options not ready');

    const options = this.#entityDownloadOptionsResource.value();
    if (!options)
      return this.#snackbar.showMessage('No download options available for this entity');

    const element = this.element();
    if (!element || !isEntity(element))
      return this.#snackbar.showMessage('No entity selected for download');

    if (!element.options?.allowDownload)
      return this.#snackbar.showMessage('Download not allowed for this entity');

    return this.#dialogHelper.openEntityDownloadDialog(element, options);
  }
}
