import { StepperSelectionEvent } from '@angular/cdk/stepper';
import {
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatStep, MatStepper, MatStepperModule } from '@angular/material/stepper';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import fscreen from 'fscreen';
import {
  BehaviorSubject,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  firstValueFrom,
  map,
  of,
  startWith,
  switchMap,
} from 'rxjs';

import { AsyncPipe, CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatError, MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { type ExtenderPlugin, ExtenderSlotDirective } from '@kompakkt/extender';
import ObjectID from 'bson-objectid';
import { OutlinedInputComponent } from 'src/app/components/outlined-input/outlined-input.component';
import { TabsComponent } from 'src/app/components/tabs/tabs.component';
import { ConfirmationDialogComponent, VisibilityAndAccessDialogComponent } from 'src/app/dialogs';
import { ChangedVisibilitySettings } from 'src/app/dialogs/visibility-and-access-dialog/visibility-and-access-dialog.component';
import { AnimatedImageDirective } from 'src/app/directives/animated-image.directive';
import { DigitalEntity, PhysicalEntity } from 'src/app/metadata';
import { Licences } from 'src/app/metadata/licences';
import { TranslatePipe } from 'src/app/pipes';
import { GetSketchfabPreviewPipe } from 'src/app/pipes/get-sketchfab-preview.pipe';
import {
  AccountService,
  BackendService,
  ContentProviderService,
  EventsService,
  supportedFileFormats,
  UploadHandlerService,
} from 'src/app/services';
import { getServerUrl } from 'src/app/util/get-server-url';
import {
  IContact,
  IDigitalEntity,
  IEntity,
  IEntitySettings,
  IFile,
  IStrippedUserData,
} from 'src/common';
import { environment } from 'src/environment';
import { EntityComponent } from '../../components/metadata/entity/entity.component';
import { UploadComponent } from '../../components/upload/upload.component';

@Component({
  selector: 'app-add-entity-wizard',
  templateUrl: './add-entity-wizard.component.html',
  styleUrls: ['./add-entity-wizard.component.scss'],
  imports: [
    CommonModule,
    ExtenderSlotDirective,
    MatIconModule,
    MatStepperModule,
    UploadComponent,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSidenavModule,
    MatListModule,
    MatTooltipModule,
    FormsModule,
    ReactiveFormsModule,
    MatError,
    MatButtonModule,
    EntityComponent,
    AnimatedImageDirective,
    AsyncPipe,
    TranslatePipe,
    MatChipsModule,
    VisibilityAndAccessDialogComponent,
    OutlinedInputComponent,
    GetSketchfabPreviewPipe,
    TabsComponent,
  ],
  host: {
    '[style.width]': 'wizardWidth()',
  },
})
export class AddEntityWizardComponent implements OnInit, OnDestroy {
  private translatePipe = inject(TranslatePipe);
  public uploadHandler = inject(UploadHandlerService);
  private account = inject(AccountService);
  private backend = inject(BackendService);
  private router = inject(Router);
  private content = inject(ContentProviderService);
  private sanitizer = inject(DomSanitizer);
  private events = inject(EventsService);
  // When opened as a dialog
  private dialog = inject(MatDialog);
  public dialogRef = inject(MatDialogRef<AddEntityWizardComponent>, { optional: true });
  public dialogData = inject<IEntity | undefined>(MAT_DIALOG_DATA, { optional: true });

  private stepper = viewChild<MatStepper>('stepper');
  public stepUpload = viewChild<MatStep>('stepUpload');
  public stepSettings = viewChild<MatStep>('stepSettings');
  public stepMetadata = viewChild<MatStep>('stepMetadata');
  public stepFinalize = viewChild<MatStep>('stepFinalize');

  wizardWidth = computed(() => {
    const stepper = this.stepper();
    const defaultWidth = 'min(50rem, 80vw)';

    if (!stepper?.selected) return defaultWidth;

    if (stepper.selected === this.stepSettings()) return 'min(80rem, 80vw)';
    if (stepper.selected === this.stepMetadata()) return 'min(60rem, 80vw)';

    return defaultWidth;
  });

  readonly digitalEntity$ = new BehaviorSubject(new DigitalEntity());
  readonly uploadedFiles = signal<IFile[]>([]);
  readonly serverEntity = signal<IEntity | undefined>(undefined);
  readonly entitySettings = signal<IEntitySettings | undefined>(undefined);
  readonly changedVisibilitySettings = signal<ChangedVisibilitySettings | undefined>(undefined);

  viewerUrl = computed(() => {
    const entity = this.serverEntity();
    if (!entity || !entity._id) return undefined;
    const url = `${environment.viewer_url}${
      environment.viewer_url.endsWith('index.html') ? '' : '/'
    }?mode=upload&entity=${entity._id}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  public availableRoles = [
    { type: 'RIGHTS_OWNER', value: 'Rightsowner', checked: false },
    { type: 'CREATOR', value: 'Creator', checked: false },
    { type: 'EDITOR', value: 'Editor', checked: false },
    { type: 'DATA_CREATOR', value: 'Data Creator', checked: false },
    { type: 'CONTACT_PERSON', value: 'Contact Person', checked: false },
  ];

  // While waiting for server responses, block further user interaction
  public isFinishing = signal(false);
  public isFinished = signal(false);

  public externalFileControlExtensions = ['glb', 'stl', 'spz', 'splat'];
  public externalFileControl = new FormControl('', ctrl => {
    const value = ctrl.value as string;

    // No checking on empty
    if (value.length === 0) return null;

    // Check for url
    if (!value.match(/^https?:\/\//)) return { nourl: true };

    // Check for matching host protocol
    if (value.startsWith('http://')) return { unsafe: true };

    // Check supported file extensions
    const ext = value.slice(value.lastIndexOf('.')).slice(1);
    if (!this.externalFileControlExtensions.includes(ext)) return { unsupported: true };

    return null;
  });

  public sketchfabGroup = new FormGroup({
    token: new FormControl('', {
      nonNullable: true,
      validators: [Validators.minLength(1)],
    }),
    url: new FormControl('', {
      nonNullable: true,
      validators: [Validators.minLength(1)],
    }),
  });
  sketchfabModelId$ = this.sketchfabGroup.controls.url.valueChanges.pipe(
    startWith(''),
    map(url => {
      if (!url) return;
      const match = url.match(/sketchfab\.com\/3d-models\/([^\/?#]+)/);
      if (!match) return;
      return match.at(1)?.split('-').at(-1);
    }),
  );
  sketchfabModel$ = combineLatest([
    this.sketchfabGroup.controls.token.valueChanges.pipe(
      startWith(this.sketchfabGroup.controls.token.value),
    ),
    this.sketchfabModelId$,
  ]).pipe(
    filter(([token]) => this.sketchfabGroup.controls.token.valid && token.length > 0),
    map(([_, modelId]) => modelId),
    distinctUntilChanged(),
    debounceTime(500),
    switchMap(id => (id ? this.backend.getSketchfabModelDetails(id) : of(undefined))),
  );
  sketchfabLicence = computed(() => {
    const model = this.sketchfabModel();
    const sketchfabLicence = model?.license.slug?.replaceAll('-', '').toUpperCase();
    return sketchfabLicence;
  });
  sketchfabModel = toSignal(this.sketchfabModel$);
  wasSketchfabUploaded = signal(false);
  isImportingSketchfab = signal(false);
  sourceSelection = signal<'upload' | 'sketchfab' | 'external'>('upload');

  Licences = Licences;

  private strippedUser = toSignal(this.account.strippedUser$, {
    initialValue: {
      _id: '',
      username: '',
      fullname: '',
    } as IStrippedUserData,
  });

  // Change detection
  /*private lastDigitalEntityValue = JSON.stringify(this.entity);
  private digitalEntityTimer: any | undefined;*/

  constructor() {
    this.sketchfabModel$.subscribe(console.log);

    this.account.isAuthenticated$.subscribe(isAuthenticated => {
      if (!isAuthenticated) this.dialogRef?.close('User is not authenticated');
    });

    this.events.$windowMessage
      .pipe(filter(message => message?.data?.type === 'settings'))
      .subscribe(async message => {
        this.entitySettings.set(message.data.settings);
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

  public debugEvent({ event }: { componentName: string; plugin?: ExtenderPlugin; event: Event }) {
    const { detail } = event as CustomEvent<{ entity: DigitalEntity; isValid: boolean }>;
    this.isPluginDigitalEntity$.next(true);
    this.isPluginDigitalEntityValid$.next(detail.isValid);
    this.digitalEntity$.next(detail.entity);
  }

  getRoleValue(roleType: string): string {
    const role = this.availableRoles.find(r => r.type === roleType);
    return role ? role.value : roleType; // Fallback to roleType if no match is found
  }

  getFormattedRoles(roles: string[] | undefined): string {
    if (!roles) {
      return ''; // Return an empty string if roles is undefined
    }
    return roles.map(role => this.getRoleValue(role)).join(', ');
  }

  getMail(contactReferences: { [key: string]: IContact }): string | null {
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

  uploadValid = computed(
    () =>
      this.uploadedFiles().length > 0 || (!!this.sketchfabModel() && this.wasSketchfabUploaded()),
  );

  get canFinish() {
    return this.isDigitalEntityValid && this.settingsValid() && this.uploadValid();
  }

  get externalFileValid() {
    return this.externalFileControl.valid && !!this.externalFileControl.value;
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
    const hasAllChecksums = this.uploadHandler.hasAllChecksums();
    return showBeginUpload && hasAllChecksums && !isEmpty;
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
    }
  }

  private updateDigitalEntityTimer = () => {
    /*if (this.digitalEntityTimer) {
      clearTimeout(this.digitalEntityTimer);
    }
    this.digitalEntityTimer = setTimeout(() => {
      this.updateDigitalEntity();
    }, 10000);*/
  };

  public async uploadBaseEntity(stepper: MatStepper) {
    const externalFile = this.externalFileControl.value as string;
    const uploadedFiles = this.uploadedFiles();

    const mediaType =
      (this.dialogData?.mediaType ?? this.externalFileValid)
        ? this.uploadHandler.determineMediaType([externalFile])
        : this.uploadHandler.mediaType();

    if (uploadedFiles.length === 0 && !this.externalFileValid) {
      throw new Error('No uploaded files found');
    }

    if (!mediaType) {
      throw new Error('Could not determine type of uploaded files');
    }

    const _id = new ObjectID().toString();
    const entity = {
      _id,
      name: `Temp-${_id}`,
      annotations: {},
      files: uploadedFiles,
      externalFile: externalFile || undefined,
      creator: this.strippedUser(),
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
        lights: [
          {
            type: 'HemisphericLight',
            position: { x: 0, y: -1, z: 0 },
            intensity: 1,
          },
          {
            type: 'HemisphericLight',
            position: { x: 0, y: 1, z: 0 },
            intensity: 1,
          },
          {
            type: 'PointLight',
            position: { x: 1, y: 10, z: 1 },
            intensity: 1,
          },
        ],
        rotation: { x: 0, y: 0, z: 0 },
        scale: 1,
      },
      finished: false,
      online: false,
      mediaType,
      dataSource: { isExternal: false, service: 'kompakkt' },
      relatedDigitalEntity: { _id: `${this.digitalEntity$.getValue()._id}` },
      whitelist: { enabled: false, persons: [], groups: [] },
      processed: { raw: '', high: '', medium: '', low: '' },
    } satisfies IEntity;

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
      .pushEntity(entity)
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

  public async updateVisibility(visibilityOptions: ChangedVisibilitySettings) {
    this.changedVisibilitySettings.set(visibilityOptions);
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

    if (this.serverEntity()?.finished) {
      console.log('Prevent updating finished entity');
      return;
    }

    this.backend
      .pushDigitalEntity(digitalEntity)
      .then(result => console.log('Updated:', result))
      .catch(err => console.error(err));
  }

  public async tryFinish(stepper: MatStepper, lastStep: MatStep) {
    if (this.isFinishing()) {
      console.log('Already trying to finish entity');
      return;
    }
    this.isFinishing.set(true);

    const digitalEntity = this.digitalEntity$.getValue();
    const settings = this.entitySettings();
    const files = this.uploadedFiles();
    const visibilitySettings = this.changedVisibilitySettings();

    if (!settings) return;

    console.log('Entity:', digitalEntity, 'Settings:', settings, 'Upload:', files);
    console.log('Sending:', digitalEntity);

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
            whitelist: this.dialogData.whitelist,
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

      lastStep.completed = true;
      stepper.next();
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
      .navigate([`/entity/${serverEntity._id}`])
      .then(() => {
        if (this.dialogRef) {
          this.dialogRef.close(undefined);
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
    return firstValueFrom(
      this.dialog
        .open(ConfirmationDialogComponent, {
          data: 'Do you want to close the upload?',
        })
        .afterClosed(),
    );
  }

  public async importSketchfabModel(stepper: MatStepper) {
    if (this.isImportingSketchfab()) return;
    this.isImportingSketchfab.set(true);
    const { token, url } = this.sketchfabGroup.value;
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

    const _id = new ObjectID().toString();
    const entity = {
      _id,
      name: selectedModel.name,
      annotations: {},
      files: [sketchfabFile],
      creator: this.strippedUser(),
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
        lights: [
          {
            type: 'HemisphericLight',
            position: { x: 0, y: -1, z: 0 },
            intensity: 1,
          },
          {
            type: 'HemisphericLight',
            position: { x: 0, y: 1, z: 0 },
            intensity: 1,
          },
          {
            type: 'PointLight',
            position: { x: 1, y: 10, z: 1 },
            intensity: 1,
          },
        ],
        rotation: { x: 0, y: 0, z: 0 },
        scale: 1,
      },
      finished: false,
      online: false,
      mediaType,
      dataSource: { isExternal: false, service: 'sketchfab' },
      relatedDigitalEntity: {
        _id: `${this.digitalEntity$.getValue()._id}`,
        title: selectedModel.name,
        description: selectedModel.description,
        licence: hasKompakktLicence ? sketchfabLicence : undefined,
      },
      whitelist: { enabled: false, persons: [], groups: [] },
      processed: { raw: '', high: '', medium: '', low: '' },
    } satisfies IEntity;

    entity.processed = {
      raw: sketchfabFile.file_link,
      high: sketchfabFile.file_link,
      medium: sketchfabFile.file_link,
      low: sketchfabFile.file_link,
    };

    const serverEntity = await this.backend
      .pushEntity(entity)
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
    this.uploadHandler.resetQueue(false);
    this.uploadedFiles.set([]);
    this.entitySettings.set(undefined);
    this.serverEntity.set(undefined);
  }
}
