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
  ChangeDetectionStrategy,
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
import { BehaviorSubject, empty, filter, firstValueFrom } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import {
  EntityAccessRole,
  IContact,
  IDigitalEntity,
  IEntity,
  IEntitySettings,
  IFile,
  CreatorField,
  isEntitySettings,
  isDigitalEntity,
} from '@kompakkt/common';
import { ExtenderSlotManager } from '@kompakkt/plugins/extender';
import ObjectID from 'bson-objectid';
import { OutlinedInputComponent } from 'src/app/components/outlined-input/outlined-input.component';
import { TabsComponent } from 'src/app/components/tabs/tabs.component';
import { DigitalEntity, PhysicalEntity } from 'src/app/metadata';
import { Licences } from 'src/app/metadata/licences';
import { TranslatePipe } from 'src/app/pipes/translate.pipe';
import { GetSketchfabPreviewPipe } from 'src/app/pipes/get-sketchfab-preview.pipe';
import { IsLastStepPipe } from 'src/app/pipes/is-last-step.pipe';
import {
  AccountService,
  BackendService,
  ContentProviderService,
  EventsService,
  supportedFileFormats,
  UploadHandlerService,
} from 'src/app/services';
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
} from '@angular/forms/signals';
import { CombinedFormErrorsComponent } from 'src/app/components/combined-form-errors/combined-form-errors.component';
import { VisibilityAndAccessDialogComponent } from '../visibility-and-access-dialog/visibility-and-access-dialog.component';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';

const SECURE_REGEX = /^https:\/\//;

const emptyEntity = ({
  _id,
  name,
  creator,
  relatedDigitalEntityId,
  mediaType,
}: {
  _id: string;
  name: string;
  creator: CreatorField;
  relatedDigitalEntityId: string;
  mediaType: string;
}): IEntity =>
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
    relatedDigitalEntity: { _id: relatedDigitalEntityId },
    processed: { raw: '', high: '', medium: '', low: '' },
    access: [{ ...creator, role: EntityAccessRole.owner }],
  }) satisfies IEntity;

@Component({
  selector: 'app-create-new-entity',
  templateUrl: './create-new-entity.component.html',
  styleUrls: ['./create-new-entity.component.scss'],
  imports: [
    FormField,
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
    AsyncPipe,
    TranslatePipe,
    IsLastStepPipe,
    VisibilityAndAccessDialogComponent,
    OutlinedInputComponent,
    GetSketchfabPreviewPipe,
    TabsComponent,
    CombinedFormErrorsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  host: {
    '[style.width]': 'wizardWidth()',
  },
})
export class CreateNewEntityComponent implements AfterViewInit, OnInit, OnDestroy {
  private translatePipe = inject(TranslatePipe);
  public uploadHandler = inject(UploadHandlerService);
  private account = inject(AccountService);
  private backend = inject(BackendService);
  private router = inject(Router);
  private content = inject(ContentProviderService);
  private sanitizer = inject(DomSanitizer);
  private events = inject(EventsService);
  private dialog = inject(MatDialog);
  public dialogRef = inject(MatDialogRef<CreateNewEntityComponent>, {
    optional: true,
  });
  public dialogData = inject<IEntity | undefined>(MAT_DIALOG_DATA, {
    optional: true,
  });

  public stepper = viewChild<MatStepper>('stepper');
  public stepUpload = viewChild<MatStep>('stepUpload');
  public stepSettings = viewChild<MatStep>('stepSettings');
  public stepMetadata = viewChild<MatStep>('stepMetadata');
  public selectedStep = signal<CdkStep | undefined>(this.stepUpload());

  wizardWidth = computed(() => {
    const selectedStep = this.selectedStep();
    const defaultWidth = 'min(50rem, 80vw)';

    if (!selectedStep) return defaultWidth;

    if (selectedStep === this.stepSettings()) return 'min(80rem, 80vw)';
    if (selectedStep === this.stepMetadata()) return 'min(60rem, 80vw)';

    return defaultWidth;
  });

  readonly digitalEntity$ = new BehaviorSubject(new DigitalEntity());
  readonly uploadedFiles = signal<IFile[]>([]);
  readonly serverEntity = signal<IEntity | undefined>(undefined);
  readonly entitySettings = signal<IEntitySettings | undefined>(undefined);
  private initialEntityFinished = signal(false);

  viewerUrl = computed(() => {
    const entity = this.serverEntity();
    if (!entity || !entity._id) return undefined;
    const url = `${environment.viewer_url}${
      environment.viewer_url.endsWith('index.html') ? '' : '/'
    }?mode=upload&entity=${entity._id}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  // While waiting for server responses, block further user interaction
  public isFinishing = signal(false);
  public isFinished = signal(false);

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
    loader: ({ params }) => this.backend.getSketchfabModelDetails(params.id),
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

  #strippedUser = toSignal(this.account.strippedUser$);
  #currentProfile = toSignal(this.account.currentProfile$);
  #creator = computed(() => {
    const strippedUser = this.#strippedUser();
    const selectedProfile = this.#currentProfile();

    if (!strippedUser || !selectedProfile) return undefined;

    return {
      ...strippedUser,
      profile: { profileId: selectedProfile._id, type: selectedProfile.type },
    } as CreatorField;
  });

  // Change detection
  /*private lastDigitalEntityValue = JSON.stringify(this.entity);
  private digitalEntityTimer: any | undefined;*/

  constructor() {
    effect(() => {
      const model = this.sketchfabModel();
      console.log('Sketchfab Model', model);
    });

    this.account.isAuthenticated$.subscribe(isAuthenticated => {
      if (!isAuthenticated) this.dialogRef?.close('User is not authenticated');
    });

    this.events.windowMessages$
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

  isPluginDigitalEntity$ = new BehaviorSubject(false);
  isPluginDigitalEntityValid$ = new BehaviorSubject(false);

  getMail(contactReferences: Record<string, IContact>): string | null {
    if (!contactReferences) {
      return null;
    }
    const mail = Object.values(contactReferences)[0];
    return mail?.mail || null;
  }

  serverEntityFinished = computed(() => this.serverEntity()?.finished);

  get isDigitalEntityValid() {
    const isPluginDigitalEntity = this.isPluginDigitalEntity$.getValue();
    if (isPluginDigitalEntity) {
      return this.isPluginDigitalEntityValid$.getValue();
    }
    const digitalEntity = this.digitalEntity$.getValue();
    return DigitalEntity.checkIsValid(digitalEntity);
  }

  settingsValid = computed(() => this.entitySettings() !== undefined);

  imagePreviewUrl = computed(() => {
    const settings = this.entitySettings();
    if (!settings?.preview) return undefined;
    const isBase64 = settings.preview.includes(';base64,');
    return isBase64 ? settings.preview : getServerUrl(`${settings.preview}?t=${Date.now()}`);
  });

  uploadValid = computed(() => {
    if (!!this.sketchfabModel()) {
      return this.wasSketchfabUploaded();
    }

    if (!!this.serverEntity()?.externalFile) {
      return true;
    }

    return this.uploadedFiles().length > 0 && this.uploadHandler.hasAllChecksums();
  });

  get canFinish() {
    return this.isDigitalEntityValid && this.settingsValid() && this.uploadValid();
  }

  isAuthenticated$ = this.account.isAuthenticated$;

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
      const { relatedDigitalEntity, settings } = entity;
      this.serverEntity.set(entity);
      this.digitalEntity$.next(new DigitalEntity(relatedDigitalEntity as IDigitalEntity));
      console.log('AddEntityWizard DialogData', this.dialogData, relatedDigitalEntity);
      this.entitySettings.set(
        this.dialogData.settings.preview !== '' ? { ...this.dialogData.settings } : undefined,
      );
      this.uploadedFiles.set(this.dialogData.files);
      const stepper = this.stepper();
      if (stepper) {
        stepper.steps.first.interacted = true;
      }
      this.initialEntityFinished.set(!!this.dialogData.finished);
    }
  }

  digitalEntityWizardSlotRef = viewChild<ElementRef<HTMLElement>>('digitalEntityWizardSlot');
  #viewContainerRef = inject(ViewContainerRef);
  #slotSubscription?: Subscription;
  ngAfterViewInit() {
    this.stepper()?.selectionChange.subscribe(event => {
      console.log('Stepper selectionChange', event);
      this.selectedStep.set(event.selectedStep);

      // Register Slot for Metadata step
      if (event.selectedStep === this.stepMetadata()) {
        void this.#registerDigitalEntityWizardSlot();
      }
    });

    this.selectedStep.set(this.stepper()?.selected);
  }

  async #registerDigitalEntityWizardSlot() {
    await new Promise<void>(resolve =>
      setTimeout(() => {
        resolve();
      }, 10),
    );
    const elementRef = this.digitalEntityWizardSlotRef();
    if (!elementRef) {
      console.error('No elementRef for digitalEntityWizardSlot');
      return;
    }
    this.#slotSubscription = ExtenderSlotManager.registerSlot({
      slotName: 'entity-wizard',
      slotBehaviour: 'replace',
      dataObservable: this.digitalEntity$,
      elementRef,
      viewContainerRef: this.#viewContainerRef,
    }).subscribe(slotEvent => {
      const { detail } = slotEvent.event as CustomEvent<{
        entity: DigitalEntity;
        isValid: boolean;
      }>;
      console.log('Slot event received in CreateNewEntityComponent', slotEvent, detail);
      if (
        'entity' in detail &&
        'isValid' in detail &&
        isDigitalEntity(detail) &&
        typeof detail.isValid === 'boolean'
      ) {
        this.isPluginDigitalEntity$.next(true);
        this.isPluginDigitalEntityValid$.next(detail.isValid);
        this.digitalEntity$.next(detail.entity);
      }
    });
  }

  private updateDigitalEntityTimer = () => {
    /*if (this.digitalEntityTimer) {
      clearTimeout(this.digitalEntityTimer);
    }
    this.digitalEntityTimer = setTimeout(() => {
      this.updateDigitalEntity();
    }, 10000);*/
  };

  showVisibilityStep = computed(() => {
    const hasDialogData = !!this.dialogRef && !!this.dialogData;
    if (!hasDialogData) return true;
    return !this.initialEntityFinished();
  });

  public async uploadBaseEntity(stepper: MatStepper) {
    const externalFile = this.externalFileControlForm().value();
    const externalFileValid = this.externalFileControlForm().valid();
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
      relatedDigitalEntityId: `${this.digitalEntity$.getValue()._id}`,
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

    const serverEntity = await this.backend
      .pushEntity(entity, { profileId: this.#currentProfile()?._id })
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
    this.digitalEntity$.getValue().type = mediaType;
    stepper.next();
  }

  public async updateSettings() {
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

    await this.backend
      .pushEntity({ ...serverEntity, settings })
      .then(result => {
        console.log('Updated settings:', result);
        this.serverEntity.set(result);
        this.entitySettings.set(result.settings);
      })
      .catch(err => console.error(err));
  }

  public async updateDigitalEntity() {
    const digitalEntity = this.digitalEntity$.getValue();

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

    await this.backend
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

  public async tryFinish(
    stepper: MatStepper,
    visibilityDialogComponent: VisibilityAndAccessDialogComponent,
  ) {
    if (this.isFinishing()) {
      console.log('Already trying to finish entity');
      return;
    }
    this.isFinishing.set(true);

    const visibilitySettings = visibilityDialogComponent.changedSettings();
    const digitalEntity = this.digitalEntity$.getValue();
    const settings = this.entitySettings();
    const files = this.uploadedFiles();

    console.log('tryFinish', {
      visibilitySettings,
      digitalEntity,
      settings,
      files,
    });

    if (!settings || !visibilitySettings) return;

    digitalEntity.phyObjs = digitalEntity.phyObjs.filter(obj => PhysicalEntity.checkIsValid(obj));

    const serverEntityResult = await this.backend
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
      .then(entity => this.backend.pushEntity(entity))
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

  public navigateToFinishedEntity() {
    const serverEntity = this.serverEntity();
    if (!serverEntity) return;
    this.router
      .navigate([`/entity/${serverEntity._id}`], {
        onSameUrlNavigation: 'reload',
      })
      .then(() => {
        if (this.dialogRef) {
          this.dialogRef.close(undefined);
          // TODO: Deprecate in favor of AccountService.updateTrigger$
          this.content.updateContent();
        }
      })
      .catch(e => console.error(e));
  }

  // Steps require interaction before they can be completed
  // but some steps might be correct out of the box.
  // mark steps as interacted with on selection
  public stepInteraction(event: StepperSelectionEvent) {
    event.selectedStep.interacted = true;
  }

  public async closeWindow() {
    if (await this.confirmClose()) {
      this.dialogRef?.close();
    }
  }

  private confirmClose(): Promise<boolean> {
    const stateString = this.serverEntity() ? 'metadata editor' : 'upload';

    return firstValueFrom(
      this.dialog
        .open(ConfirmationDialogComponent, {
          data: {
            title: `Close ${stateString}`,
            message: `Do you want to close the ${stateString}?`,
          },
        })
        .afterClosed(),
    );
  }

  public async importSketchfabModel(stepper: MatStepper) {
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
    const sketchfabFile = await this.backend.downloadAndPrepareSketchfabModel(
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
      relatedDigitalEntityId: `${this.digitalEntity$.getValue()._id}`,
    });
    entity.files = [sketchfabFile];
    entity.dataSource.service = 'sketchfab';
    (entity.relatedDigitalEntity as Partial<IDigitalEntity>).title = selectedModel.name;
    (entity.relatedDigitalEntity as Partial<IDigitalEntity>).description =
      selectedModel.description;
    (entity.relatedDigitalEntity as Partial<IDigitalEntity>).licence = hasKompakktLicence
      ? sketchfabLicence
      : undefined;
    (entity.relatedDigitalEntity as Partial<IDigitalEntity>).externalLink ??= [];
    (entity.relatedDigitalEntity as Partial<IDigitalEntity>).externalLink?.push({
      description: 'Sketchfab URL',
      value: url,
    });

    entity.processed = {
      raw: sketchfabFile.file_link,
      high: sketchfabFile.file_link,
      medium: sketchfabFile.file_link,
      low: sketchfabFile.file_link,
    };

    const serverEntity = await this.backend
      .pushEntity(entity, { profileId: this.#currentProfile()?._id })
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
    this.digitalEntity$.next(
      new DigitalEntity({ ...entity.relatedDigitalEntity, type: mediaType }),
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
