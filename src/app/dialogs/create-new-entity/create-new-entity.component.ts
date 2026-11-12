import { CdkStep, StepperSelectionEvent } from '@angular/cdk/stepper';
import {
  AfterViewInit,
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  OnInit,
  signal,
  viewChild,
  model,
  resource,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatStep, MatStepper, MatStepperModule } from '@angular/material/stepper';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import fscreen from 'fscreen';
import { filter, firstValueFrom } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import {
  EntityAccessRole,
  IContact,
  IEntity,
  IEntitySettings,
  IFile,
  CreatorField,
  isEntitySettings,
  isDigitalEntity,
  IDigitalEntityResolved,
  IEntityResolved,
} from '@kompakkt/common';
import { ExtenderSlotManager } from '@kompakkt/plugins/extender';
import ObjectID from 'bson-objectid';
import { OutlinedInputComponent } from 'src/app/components/outlined-input/outlined-input.component';
import { TabsComponent } from 'src/app/components/tabs/tabs.component';
import { Licences } from 'src/app/metadata/licences';
import { GetSketchfabPreviewPipe } from 'src/app/pipes/get-sketchfab-preview.pipe';
import { IsLastStepPipe } from 'src/app/pipes/is-last-step.pipe';
import { getServerUrl } from 'src/app/util/get-server-url';
import { environment } from 'src/environment';
import { EntityComponent } from '../../components/metadata/entity/entity.component';
import { UploadComponent } from '../../components/upload/upload.component';
import { ElementRef } from '@angular/core';
import { ViewContainerRef } from '@angular/core';
import { Subscription } from 'rxjs';
import {
  applyWhen,
  applyWhenValue,
  form,
  FormField,
  maxLength,
  minLength,
  pattern,
  required,
  validate,
  ValidationError,
} from '@angular/forms/signals';
import { CombinedFormErrorsComponent } from 'src/app/components/combined-form-errors/combined-form-errors.component';
import { VisibilityAndAccessDialogComponent } from '../visibility-and-access-dialog/visibility-and-access-dialog.component';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { emptyDigitalEntity, isPhysicalEntityValid, validateDigitalEntity } from 'src/app/metadata';
import { MatMenuModule } from '@angular/material/menu';
import {
  supportedFileFormats,
  UploadHandlerService,
} from 'src/app/services/upload-handler.service';
import { AccountService } from 'src/app/services/account.service';
import { BackendService } from 'src/app/services/backend.service';
import { EventsService } from 'src/app/services/events.service';
import { TranslatePipe } from 'src/app/pipes/translate.pipe';

const SECURE_REGEX = /^https:\/\//;

const emptyEntity = ({
  _id,
  name,
  creator,
  relatedDigitalEntity,
  mediaType,
}: {
  _id: string;
  name: string;
  creator: CreatorField;
  relatedDigitalEntity: IDigitalEntityResolved;
  mediaType: string;
}): IEntityResolved =>
  ({
    _id,
    name,
    creator,
    mediaType,
    annotations: {},
    files: [],
    settings: {
      preview: '',
      cameraPositionInitial: {
        position: { x: 0, y: 0, z: 0 },
        target: { x: 0, y: 0, z: 0 },
      },
      background: {
        color: { r: 51, g: 51, b: 51, a: 229.5 },
        effect: false,
      },
      lights: [],
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
    },
    finished: false,
    online: false,
    dataSource: { isExternal: false, service: 'kompakkt' },
    relatedDigitalEntity,
    processed: { raw: '', high: '', medium: '', low: '' },
    access: [{ ...creator, role: EntityAccessRole.owner }],
  }) satisfies IEntityResolved;

@Component({
  selector: 'app-create-new-entity',
  templateUrl: './create-new-entity.component.html',
  styleUrls: ['./create-new-entity.component.scss'],
  imports: [
    FormField,
    MatMenuModule,
    MatIconModule,
    MatStepperModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSidenavModule,
    MatListModule,
    MatTooltipModule,
    MatChipsModule,
    MatButtonModule,
    UploadComponent,
    EntityComponent,
    IsLastStepPipe,
    VisibilityAndAccessDialogComponent,
    OutlinedInputComponent,
    GetSketchfabPreviewPipe,
    TabsComponent,
    CombinedFormErrorsComponent,
    TranslatePipe,
  ],
  host: {
    '[style.width]': 'wizardWidth()',
  },
})
export class CreateNewEntityComponent implements AfterViewInit, OnInit, OnDestroy {
  #backend = inject(BackendService);
  #router = inject(Router);
  #sanitizer = inject(DomSanitizer);
  #events = inject(EventsService);
  #dialog = inject(MatDialog);
  uploadHandler = inject(UploadHandlerService);
  account = inject(AccountService);
  dialogRef = inject(MatDialogRef<CreateNewEntityComponent>, {
    optional: true,
  });
  dialogData = inject<IEntity | undefined>(MAT_DIALOG_DATA, {
    optional: true,
  });

  stepper = viewChild<MatStepper>('stepper');
  stepUpload = viewChild<MatStep>('stepUpload');
  stepSettings = viewChild<MatStep>('stepSettings');
  stepMetadata = viewChild<MatStep>('stepMetadata');
  selectedStep = signal<CdkStep | undefined>(this.stepUpload());

  wizardWidth = computed(() => {
    const selectedStep = this.selectedStep();
    const defaultWidth = 'min(50rem, 80vw)';

    if (!selectedStep) return defaultWidth;

    if (selectedStep === this.stepSettings()) return 'min(80rem, 80vw)';
    if (selectedStep === this.stepMetadata()) return 'min(60rem, 80vw)';

    return defaultWidth;
  });

  pluginDigitalEntity = signal<{
    isActive: boolean;
    isValid: boolean;
    validationErrors: ValidationError[];
  }>({
    isActive: false,
    isValid: false,
    validationErrors: [],
  });

  digitalEntity = model<IDigitalEntityResolved>(emptyDigitalEntity());
  digitalEntityForm = form(this.digitalEntity, _ => {
    applyWhen(
      _,
      () => !this.pluginDigitalEntity().isActive,
      ctx => {
        validateDigitalEntity(ctx);
      },
    );
  });
  errorSummary = computed<ValidationError[]>(() => {
    const { isActive, isValid, validationErrors } = this.pluginDigitalEntity();
    if (isActive) {
      if (validationErrors?.length) return validationErrors;
      if (!isValid)
        return [
          {
            kind: 'Plugin Error',
            message:
              'Metadata form is modified by a plugin, and the plugin marked current metadata as invalid. Please check all tabs manually.',
          },
        ];
      return [];
    }
    return this.digitalEntityForm().errorSummary();
  });

  digitalEntityObservable$ = toObservable(this.digitalEntity);
  uploadedFiles = signal<IFile[]>([]);
  serverEntity = signal<IEntity | undefined>(undefined);
  entitySettings = signal<IEntitySettings | undefined>(undefined);
  #initialEntityFinished = signal(false);

  viewerUrl = computed(() => {
    const entity = this.serverEntity();
    if (!entity || !entity._id) return undefined;
    const url = `${environment.viewer_url}${
      environment.viewer_url.endsWith('index.html') ? '' : '/'
    }?mode=upload&entity=${entity._id}`;
    return this.#sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  // While waiting for server responses, block further user interaction
  isFinishing = signal(false);
  isFinished = signal(false);

  externalFileControlExtensions = ['glb', 'stl', 'spz', 'splat'];
  externalFileControlModel = model('');
  externalFileControlForm = form(this.externalFileControlModel, path => {
    minLength(path, 1);
    pattern(path, SECURE_REGEX, { message: 'Source must start with https://' });
    applyWhenValue(
      path,
      value => !!value.match(SECURE_REGEX),
      path => {
        validate(path, ({ value }) => {
          const url = value();
          const ext = url.slice(url.lastIndexOf('.')).slice(1)?.toLowerCase();
          if (!this.externalFileControlExtensions.includes(ext))
            return {
              message:
                'File extension is not supported. URL needs clean file extension, e.g.: https://example.com/public/model.glb',
              kind: 'unsupportedExtension',
            };
          return null;
        });
      },
    );
  });

  sketchfabDataModel = model({ token: '', url: '' });
  sketchfabForm = form(this.sketchfabDataModel, path => {
    required(path.token, { message: 'Token is required' });
    minLength(path.token, 24, { message: 'Token should be 32 hex characters' });
    maxLength(path.token, 48, { message: 'Token should be 32 hex characters' });
    required(path.url, { message: 'Model URL is required' });
    pattern(path.url, SECURE_REGEX, { message: 'Model URL must start with https://' });
    pattern(path.url, /https:\/\/sketchfab\.com\//, {
      message: 'Model URL must be from Sketchfab: https://sketchfab.com/...',
    });
  });
  sketchfabModelId = computed(() => {
    const url = this.sketchfabForm.url().value();
    if (!url) return;
    const match = url.match(/sketchfab\.com\/3d-models\/([^/?#]+)/);
    if (!match) return;
    return match.at(1)?.split('-').at(-1);
  });
  sketchfabModelResource = resource({
    params: () => {
      const id = this.sketchfabModelId();
      const token = this.sketchfabForm.token().value();
      if (this.sketchfabForm().invalid()) return undefined;
      if (!id || !token) return undefined;
      return { id, token };
    },
    loader: ({ params }) => this.#backend.getSketchfabModelDetails(params.id),
  });
  sketchfabModel = computed(() => {
    if (!this.sketchfabModelResource.hasValue()) return;
    return this.sketchfabModelResource.value() ?? undefined;
  });
  sketchfabLicence = computed(() => {
    const model = this.sketchfabModel();
    const sketchfabLicence = model?.license.slug?.replaceAll('-', '').toUpperCase();
    return sketchfabLicence;
  });
  wasSketchfabUploaded = signal(false);
  isImportingSketchfab = signal(false);
  sourceSelection = signal<'upload' | 'sketchfab' | 'external'>('upload');

  Licences = Licences;

  #creator = computed(() => {
    const strippedUser = this.account.strippedUser();
    const selectedProfile = this.account.currentProfile();

    if (!strippedUser || !selectedProfile) return undefined;

    return {
      ...strippedUser,
      profile: { profileId: selectedProfile._id, type: selectedProfile.type },
    } as CreatorField;
  });

  // Change detection
  /*#lastDigitalEntityValue = JSON.stringify(this.entity);
  #digitalEntityTimer: any | undefined;*/

  constructor() {
    effect(() => {
      const model = this.sketchfabModel();
      console.log('Sketchfab Model', model);
    });

    effect(() => {
      const isAuthenticated = this.account.isAuthenticated();
      if (!isAuthenticated) this.dialogRef?.close('User is not authenticated');
    });

    effect(() => {
      const elementRef = this.digitalEntityWizardSlotRef();
      if (elementRef) {
        console.log('CreateNewEntity digitalEntityWizardSlotRef', elementRef);
        this.#registerDigitalEntityWizardSlot(elementRef);
      }
    });

    this.#events.windowMessages$
      .pipe(filter(message => message?.data?.type === 'settings'))
      .subscribe(async ({ data }) => {
        if (!data.data || !('entityId' in data.data) || !('settings' in data.data)) return;
        const settings = data.data.settings;
        if (!isEntitySettings(settings)) return;
        const serverEntity = this.serverEntity();
        if (serverEntity?._id !== data.data.entityId) return;
        console.log('Message received in CreateNewEntityComponent', data);
        this.entitySettings.set(settings);
        const value = this.entitySettings();
        console.log('Settings windowMessage', value);
        const stepper = this.stepper();
        if (!!value && stepper?.selected) {
          // Close fullscreen viewer before proceeding to next step
          if (fscreen.fullscreenElement) fscreen.exitFullscreen();
          stepper.selected.interacted = true;
          await this.updateSettings();
          stepper.next();
        }
      });

    effect(
      () => {
        const result = this.uploadHandler.uploadResults();
        if (result.length === 0) return;
        this.uploadedFiles.set(result);
      },
      { allowSignalWrites: true },
    );

    /*this.entity.valueChanges.subscribe(change => {
      const _stringified = JSON.stringify(change);
      if (this.lastDigitalEntityValue !== _stringified) {
        this.updateDigitalEntityTimer();
        this.lastDigitalEntityValue = _stringified;
      }
    });*/
  }

  getMail(contactReferences: Record<string, IContact>): string | null {
    if (!contactReferences) {
      return null;
    }
    const mail = Object.values(contactReferences)[0];
    return mail?.mail || null;
  }

  serverEntityFinished = computed(() => this.serverEntity()?.finished);

  isDigitalEntityValid = computed(() => {
    const { isActive, isValid } = this.pluginDigitalEntity();
    if (isActive) return isValid;
    return this.digitalEntityForm().valid();
  });

  settingsValid = computed(() => this.entitySettings() !== undefined);

  imagePreviewUrl = computed(() => {
    const settings = this.entitySettings();
    if (!settings?.preview) return undefined;
    const isBase64 = settings.preview.includes(';base64,');
    return isBase64 ? settings.preview : getServerUrl(`${settings.preview}?t=${Date.now()}`);
  });

  uploadValid = computed(() => {
    if (this.sketchfabModel()) return this.wasSketchfabUploaded();
    if (this.serverEntity()?.externalFile) return true;
    return this.uploadedFiles().length > 0 && this.uploadHandler.hasAllChecksums();
  });

  canCancel = computed(() => {
    const isUploading = this.uploadHandler.isUploading();
    const uploadCompleted = this.uploadHandler.uploadCompleted();
    const hasItems = this.uploadHandler.hasItems();
    return isUploading || uploadCompleted || hasItems;
  });

  showBeginUpload = computed(() => {
    const isUploading = this.uploadHandler.isUploading();
    const uploadCompleted = this.uploadHandler.uploadCompleted();
    return !isUploading && !uploadCompleted;
  });

  canBeginUpload = computed(() => {
    const showBeginUpload = this.showBeginUpload();
    const isEmpty = this.uploadHandler.isEmpty();
    const queueHasErrors = this.uploadHandler.queueHasErrors();
    return showBeginUpload && !isEmpty && !queueHasErrors;
  });

  showNext = computed(() => {
    const isUploading = this.uploadHandler.isUploading();
    const uploadCompleted = this.uploadHandler.uploadCompleted();
    return isUploading || uploadCompleted;
  });

  showSettingsStep = computed(() => {
    const serverEntityFinished = this.serverEntityFinished();
    const settingsValid = this.settingsValid();
    return !settingsValid || !serverEntityFinished;
  });

  ngOnInit() {
    if (this.dialogRef && this.dialogData) {
      const entity = { ...this.dialogData } as IEntity;
      const { relatedDigitalEntity } = entity;
      this.serverEntity.set(entity);
      console.log('AddEntityWizard DialogData', this.dialogData, relatedDigitalEntity);
      this.digitalEntity.set(structuredClone(relatedDigitalEntity as IDigitalEntityResolved));
      this.entitySettings.set(
        this.dialogData.settings.preview !== '' ? { ...this.dialogData.settings } : undefined,
      );
      this.uploadedFiles.set(this.dialogData.files);
      const stepper = this.stepper();
      if (stepper) {
        stepper.steps.first.interacted = true;
      }
      this.#initialEntityFinished.set(!!this.dialogData.finished);
    }
  }

  digitalEntityWizardSlotRef = viewChild<ElementRef<HTMLElement>>('digitalEntityWizardSlot');
  #viewContainerRef = inject(ViewContainerRef);
  #slotSubscription?: Subscription;
  ngAfterViewInit() {
    this.selectedStep.set(this.stepper()?.selected);
  }

  #registerDigitalEntityWizardSlot(elementRef: ElementRef<HTMLElement>) {
    this.#slotSubscription = ExtenderSlotManager.registerSlot({
      slotName: 'entity-wizard',
      slotBehaviour: 'replace',
      dataObservable: this.digitalEntityObservable$,
      elementRef,
      viewContainerRef: this.#viewContainerRef,
    }).subscribe(slotEvent => {
      const { detail } = slotEvent.event as CustomEvent<{
        entity: IDigitalEntityResolved;
        isValid: boolean;
        validationErrors?: ValidationError[];
      }>;
      console.log('Slot event received in CreateNewEntityComponent', slotEvent, detail);
      if (
        'entity' in detail &&
        'isValid' in detail &&
        isDigitalEntity(detail.entity) &&
        typeof detail.isValid === 'boolean'
      ) {
        this.pluginDigitalEntity.set({
          isActive: true,
          isValid: detail.isValid,
          validationErrors: detail.validationErrors ?? [],
        });
        this.digitalEntity.set(structuredClone(detail.entity));
      }
    });
  }

  showVisibilityStep = computed(() => {
    const hasDialogData = !!this.dialogRef && !!this.dialogData;
    if (!hasDialogData) return true;
    return !this.#initialEntityFinished();
  });

  async uploadBaseEntity(stepper: MatStepper) {
    const externalFile = this.externalFileControlForm().value();
    // TODO: valid on minLength alone seems to fail?
    const externalFileValid = this.externalFileControlForm().valid() && externalFile.length > 0;
    const uploadedFiles = this.uploadedFiles();

    const mediaType =
      (this.dialogData?.mediaType ?? externalFileValid)
        ? this.uploadHandler.determineMediaType([externalFile])
        : this.uploadHandler.mediaType();

    if (uploadedFiles.length === 0 && !externalFileValid) {
      throw new Error('No uploaded files found');
    }

    if (!mediaType) {
      throw new Error('Could not determine type of uploaded files');
    }

    const creator = this.#creator();
    if (!creator) {
      throw new Error('No creator information available');
    }

    const _id = new ObjectID().toString();
    const entity = emptyEntity({
      _id,
      name: `Temp-${_id}`,
      creator,
      mediaType,
      relatedDigitalEntity: this.digitalEntity(),
    });
    if (externalFileValid) entity.externalFile = externalFile;
    entity.files = uploadedFiles;

    // If files were uploaded, add them
    const files = this.uploadedFiles()
      .filter(file =>
        mediaType === 'model' || mediaType === 'entity'
          ? supportedFileFormats.model.filter(ext => file.file_name.toLowerCase().endsWith(ext))
              .length > 0 && file.file_format !== ''
          : file.file_format !== '',
      )
      .sort((a, b) => b.file_size - a.file_size);
    if (files.length > 0) {
      entity.processed = {
        raw: files[0].file_link,
        high: files[0].file_link,
        medium: files[Math.floor((files.length * 1) / 3)].file_link,
        low: files[files.length - 1].file_link,
      };
    }

    const serverEntity = await this.#backend
      .pushEntity(entity, { profileId: this.account.currentProfile()?._id })
      .then(res => res)
      .catch(err => {
        console.error(err);
        return undefined;
      });

    if (!serverEntity) {
      console.error('No serverEntity', this);
      return;
    }
    this.serverEntity.set(serverEntity);
    console.log('uploadBaseEntity serverEntity', this.serverEntity());

    // this.entity.objecttype = mediaType;
    this.digitalEntity.update(entity => ({ ...entity, type: mediaType }));
    stepper.next();
  }

  async updateSettings() {
    const serverEntity = this.serverEntity();
    const settings = this.entitySettings();
    if (!serverEntity) {
      console.error('No ServerEntity', this);
      return;
    }
    if (!settings) {
      console.error('No settings', this);
      return;
    }

    await this.#backend
      .pushEntity({ ...serverEntity, settings })
      .then(result => {
        console.log('Updated settings:', result);
        this.serverEntity.set(result);
        this.entitySettings.set(result.settings);
      })
      .catch(err => console.error(err));
  }

  async updateDigitalEntity() {
    const digitalEntity = this.digitalEntity();
    const serverEntity = this.serverEntity();
    const settings = this.entitySettings();

    if (!serverEntity) {
      throw new Error('No serverEntity');
    }

    if (!settings) {
      throw new Error('No settings');
    }

    const updatedEntity = {
      ...serverEntity,
      relatedDigitalEntity: digitalEntity,
      name: digitalEntity.title,
      finished: true,
    };

    await this.#backend
      .pushEntity({
        ...updatedEntity,
        settings,
      })
      .then(result => {
        console.log('Updated entity:', result);
        this.serverEntity.set(result);
        this.entitySettings.set(result.settings);
      })
      .catch(err => console.error(err));

    const stepper = this.stepper();
    const metadataStep = this.stepMetadata();
    if (stepper && metadataStep) {
      const steps = stepper.steps.toArray();
      const metadataIndex = steps.findIndex(s => s === metadataStep);
      const isLastStep = metadataIndex === steps.length - 1;
      if (isLastStep) {
        this.navigateToFinishedEntity();
      } else {
        stepper.selected!.interacted = true;
        stepper.next();
      }
    }
  }

  async tryFinish(
    stepper: MatStepper,
    visibilityDialogComponent: VisibilityAndAccessDialogComponent,
  ) {
    if (this.isFinishing()) {
      console.log('Already trying to finish entity');
      return;
    }
    this.isFinishing.set(true);

    const visibilitySettings = visibilityDialogComponent.changedSettings();
    const digitalEntity = this.digitalEntity();
    const settings = this.entitySettings();
    const files = this.uploadedFiles();

    console.log('tryFinish', {
      visibilitySettings,
      digitalEntity,
      settings,
      files,
    });

    if (!settings || !visibilitySettings) return;

    digitalEntity.phyObjs = digitalEntity.phyObjs.filter(obj => isPhysicalEntityValid(obj));

    const serverEntityResult = await this.#backend
      .pushDigitalEntity(digitalEntity)
      .then(result => {
        console.log('Got DigitalEntity from server:', result);
        if (Object.keys(result).length < 3) {
          throw new Error('Incomplete digital entity received from server');
        }

        const serverEntity = this.serverEntity();
        if (!serverEntity) {
          throw new Error('No serverEntity');
        }

        // Set finished and un-published
        let entity = serverEntity;
        entity.settings = settings;
        entity.online = false;
        entity.finished = true;

        if (this.dialogRef && this.dialogData) {
          // Overwrite with data from MatDialog if editing existing entity
          entity = {
            ...this.dialogData,
            ...entity,
            _id: this.dialogData._id,
            online: this.dialogData.online,
            access: this.dialogData.access,
            annotations: this.dialogData.annotations,
          };
        }

        if (visibilitySettings) {
          // Apply visibility settings if provided
          entity = {
            ...entity,
            online: visibilitySettings.online,
            access: visibilitySettings.access,
            options: visibilitySettings.options,
          };
        }

        // Update name and relatedDigitalEntity
        entity.name = result.title;
        entity.relatedDigitalEntity = { _id: result._id };

        console.log('Saving entity to server:', entity);
        return entity;
      })
      .then(entity => this.#backend.pushEntity(entity))
      .then(result => {
        console.log('Saved entity to server', result);
        return result;
      })
      .catch(e => {
        console.error(e);
        return undefined;
      });

    this.serverEntity.set(serverEntityResult);

    if (this.serverEntity()) {
      this.isFinishing.set(false);
      this.isFinished.set(true);

      stepper._steps.forEach(step => (step.editable = false));

      if (this.dialogRef && this.dialogData) {
        console.log('Updated entity via dialog:', this.serverEntity(), digitalEntity);
      }

      // Refresh account data
      await this.account.loginOrFetch();

      this.navigateToFinishedEntity();
    } else {
      // TODO: Error handling
      this.isFinishing.set(false);
    }
  }

  navigateToFinishedEntity() {
    const serverEntity = this.serverEntity();
    if (!serverEntity) return;
    this.#router
      .navigate([`/entity/${serverEntity._id}`], {
        onSameUrlNavigation: 'reload',
      })
      .then(() => {
        if (this.dialogRef) {
          this.dialogRef.close(undefined);
        }
      })
      .catch(e => console.error(e));
  }

  // Steps require interaction before they can be completed
  // but some steps might be correct out of the box.
  // mark steps as interacted with on selection
  stepInteraction(event: StepperSelectionEvent) {
    event.selectedStep.interacted = true;
  }

  async closeWindow() {
    if (await this.#confirmClose()) {
      this.dialogRef?.close();
    }
  }

  #confirmClose(): Promise<boolean> {
    const stateString = this.serverEntity() ? 'metadata editor' : 'upload';

    return firstValueFrom(
      this.#dialog
        .open(ConfirmationDialogComponent, {
          data: {
            title: `Close ${stateString}`,
            message: `Do you want to close the ${stateString}?`,
          },
        })
        .afterClosed(),
    );
  }

  async importSketchfabModel(stepper: MatStepper) {
    if (this.isImportingSketchfab()) return;
    this.isImportingSketchfab.set(true);
    const { token, url } = this.sketchfabForm().value();
    const selectedModel = this.sketchfabModel();
    const sketchfabLicence = this.sketchfabLicence();
    const hasKompakktLicence = sketchfabLicence ? !!Licences[sketchfabLicence] : false;
    if (!selectedModel || !token || !selectedModel.isDownloadable) {
      this.isImportingSketchfab.set(false);
      return;
    }
    const mediaType = 'model';
    const sketchfabFile = await this.#backend.downloadAndPrepareSketchfabModel(
      token,
      selectedModel.uid,
    );
    if (!sketchfabFile) {
      this.isImportingSketchfab.set(false);
      return;
    }
    console.log(sketchfabFile);

    const creator = this.#creator();
    if (!creator) {
      throw new Error('No creator information available');
    }

    const _id = new ObjectID().toString();
    const entity = emptyEntity({
      _id,
      name: selectedModel.name,
      creator,
      mediaType,
      relatedDigitalEntity: this.digitalEntity(),
    });
    entity.files = [sketchfabFile];
    entity.dataSource.service = 'sketchfab';
    entity.relatedDigitalEntity.title = selectedModel.name;
    entity.relatedDigitalEntity.description = selectedModel.description;
    entity.relatedDigitalEntity.licence = hasKompakktLicence ? (sketchfabLicence ?? '') : '';
    entity.relatedDigitalEntity.externalLink ??= [];
    entity.relatedDigitalEntity.externalLink?.push({
      description: 'Sketchfab URL',
      value: url,
    });

    entity.processed = {
      raw: sketchfabFile.file_link,
      high: sketchfabFile.file_link,
      medium: sketchfabFile.file_link,
      low: sketchfabFile.file_link,
    };

    const serverEntity = await this.#backend
      .pushEntity(entity, { profileId: this.account.currentProfile()?._id })
      .then(res => res)
      .catch(err => {
        console.error(err);
        return undefined;
      });
    this.isImportingSketchfab.set(false);

    if (!serverEntity) {
      console.error('No serverEntity', this);
      return;
    }
    this.serverEntity.set(serverEntity);
    console.log('uploadBaseEntity serverEntity', this.serverEntity());

    // this.entity.objecttype = mediaType;
    this.wasSketchfabUploaded.set(true);

    // TODO: Figure out typing on this
    this.digitalEntity.update(
      other => ({ ...other, ...entity.relatedDigitalEntity, type: mediaType }) as any,
    );
    stepper.next();
  }

  ngOnDestroy() {
    void this.uploadHandler.resetQueue(false);
    this.uploadedFiles.set([]);
    this.entitySettings.set(undefined);
    this.serverEntity.set(undefined);

    this.#slotSubscription?.unsubscribe();
  }
}
