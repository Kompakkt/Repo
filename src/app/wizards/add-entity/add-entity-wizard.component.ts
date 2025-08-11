import { StepperSelectionEvent } from '@angular/cdk/stepper';
import { Component, computed, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatStep, MatStepper, MatStepperModule } from '@angular/material/stepper';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import fscreen from 'fscreen';
import { BehaviorSubject, combineLatest, firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';

import { AsyncPipe, CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatError, MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { type ExtenderPlugin, ExtenderSlotDirective } from '@kompakkt/extender';
import ObjectID from 'bson-objectid';
import { ConfirmationDialogComponent, VisibilityAndAccessDialogComponent } from 'src/app/dialogs';
import { ChangedVisibilitySettings } from 'src/app/dialogs/visibility-and-access-dialog/visibility-and-access-dialog.component';
import { DigitalEntity, PhysicalEntity } from 'src/app/metadata';
import { TranslatePipe } from 'src/app/pipes';
import {
  AccountService,
  BackendService,
  ContentProviderService,
  EventsService,
  supportedFileFormats,
  UploadHandlerService,
  UuidService,
} from 'src/app/services';
import { getServerUrl } from 'src/app/util/get-server-url';
import { IEntity, IEntitySettings, IFile, IStrippedUserData } from 'src/common';
import { environment } from 'src/environment';
import { AnimatedImageComponent } from '../../components/animated-image/animated-image.component';
import { EntityComponent } from '../../components/metadata/entity/entity.component';
import { UploadComponent } from '../../components/upload/upload.component';

const any = (arr: any[]) => arr.some(obj => !!obj);
const all = (arr: any[]) => arr.every(obj => !!obj);
const none = (arr: any[]) => !any(arr);

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
    AnimatedImageComponent,
    AsyncPipe,
    TranslatePipe,
    MatChipsModule,
    VisibilityAndAccessDialogComponent,
  ],
})
export class AddEntityWizardComponent implements OnInit, OnDestroy {
  private translatePipe = inject(TranslatePipe);
  public uploadHandler = inject(UploadHandlerService);
  private account = inject(AccountService);
  private uuid = inject(UuidService);
  private backend = inject(BackendService);
  private router = inject(Router);
  private content = inject(ContentProviderService);
  private sanitizer = inject(DomSanitizer);
  private events = inject(EventsService);
  // When opened as a dialog
  private dialog = inject(MatDialog);
  public dialogRef = inject(MatDialogRef<AddEntityWizardComponent>, { optional: true });
  public dialogData = inject<IEntity | undefined>(MAT_DIALOG_DATA, { optional: true });

  @ViewChild('stepper')
  private stepper: MatStepper | undefined;

  @ViewChild('stepUpload')
  public stepUpload: MatStep | undefined;

  @ViewChild('stepSettings')
  public stepSettings: MatStep | undefined;

  @ViewChild('stepMetadata')
  public stepMetadata: MatStep | undefined;

  @ViewChild('stepFinalize')
  public stepFinalize: MatStep | undefined;

  readonly digitalEntity$ = new BehaviorSubject(new DigitalEntity());
  readonly uploadedFiles = signal<IFile[]>([]);
  readonly serverEntity = signal<IEntity | undefined>(undefined);
  readonly entitySettings = signal<IEntitySettings | undefined>(undefined);
  readonly changedVisibilitySettings = signal<ChangedVisibilitySettings | undefined>(undefined);

  public availableRoles = [
    { type: 'RIGHTS_OWNER', value: 'Rightsowner', checked: false },
    { type: 'CREATOR', value: 'Creator', checked: false },
    { type: 'EDITOR', value: 'Editor', checked: false },
    { type: 'DATA_CREATOR', value: 'Data Creator', checked: false },
    { type: 'CONTACT_PERSON', value: 'Contact Person', checked: false },
  ];

  // Enable linear after the entity has been finished
  public isLinear = false;
  // While waiting for server responses, block further user interaction
  public isFinishing = false;
  public isFinished = false;

  public isChoosingPublishState = true;

  public viewerUrl: SafeResourceUrl | undefined;

  public externalFileControl = new FormControl('', ctrl => {
    const value = ctrl.value as string;

    // No checking on empty
    if (value.length === 0) return null;

    // Check for url
    if (!value.match(/^https?:\/\//)) return { nourl: true };

    // Check for matching host protocol
    if (!value.includes(location.protocol)) return { unsafe: true };

    // Check supported file extensions
    const validExts = ['glb', 'babylon', 'jpg', 'png', 'jpeg', 'mp3', 'wav', 'mp4'];
    const ext = value.slice(value.lastIndexOf('.')).slice(1);
    if (!validExts.includes(ext)) return { unsupported: true };

    return null;
  });

  private strippedUser: IStrippedUserData = {
    _id: '',
    username: '',
    fullname: '',
  };

  // Change detection
  /*private lastDigitalEntityValue = JSON.stringify(this.entity);
  private digitalEntityTimer: any | undefined;*/

  constructor() {
    this.account.isAuthenticated$.subscribe(isAuthenticated => {
      if (!isAuthenticated) this.dialogRef?.close('User is not authenticated');
    });
    this.account.strippedUser$.subscribe(strippedUser => {
      this.strippedUser = strippedUser;
    });

    this.events.$windowMessage.subscribe(async message => {
      const type = message.data.type;
      switch (type) {
        case 'resetQueue':
          // If queue actually reset, reset other variables
          if (await this.uploadHandler.resetQueue()) {
            this.entitySettings.set(undefined);
            this.uploadedFiles.set([]);
            this.uuid.reset();
          }
          break;
        case 'addFile':
          this.uploadHandler.addToQueue(message.data.file);
          break;
        case 'fileList':
          console.log(message.data);
          this.uploadHandler.addMultipleToQueue(message.data.files);
          this.uploadHandler.setMediaType(message.data.mediaType);
          break;
        case 'settings':
          this.entitySettings.set(message.data.settings);
          const value = this.entitySettings();
          console.log('Settings windowMessage', value);
          if (!!value && this.stepper?.selected) {
            // Close fullscreen viewer before proceeding to next step
            if (fscreen.fullscreenElement) fscreen.exitFullscreen();
            this.stepper.selected.interacted = true;
            await this.updateSettings();
            this.stepper.next();
          }
          break;
        default:
          console.log(message.data);
      }
    });

    this.uploadHandler.results$.subscribe(result => {
      console.log('UploadResult:', result);
      this.uploadedFiles.set(result);
    });

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

  getMail(contactReferences: { [key: string]: any }): string | null {
    if (!contactReferences) {
      return null;
    }
    const mail = Object.values(contactReferences)[0];
    return mail?.mail || null;
  }

  get maxWidth() {
    if (this.stepper?.selected?.label === 'Settings') return '80rem';
    if (this.stepper?.selected?.label === 'Metadata') return '60rem';
    return '50rem';
  }

  isUploading$ = this.uploadHandler.isUploading$;

  uploadCompleted$ = this.uploadHandler.uploadCompleted$;

  isQueueEmpty$ = this.uploadHandler.isEmpty$;

  queueHasItems$ = this.isQueueEmpty$.pipe(map(v => !v));

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

  uploadValid = computed(() => this.uploadedFiles().length > 0);

  get canFinish() {
    return this.isDigitalEntityValid && this.settingsValid() && this.uploadValid();
  }

  get externalFileValid() {
    return this.externalFileControl.valid && !!this.externalFileControl.value;
  }

  isAuthenticated$ = this.account.isAuthenticated$;

  // Control buttons
  get __arr() {
    return [this.isUploading$, this.uploadCompleted$];
  }

  canCancel$ = combineLatest([...this.__arr, this.queueHasItems$]).pipe(map(any));

  canBeginUpload$ = combineLatest([...this.__arr, this.isQueueEmpty$]).pipe(map(none));

  showBeginUpload$ = combineLatest(this.__arr).pipe(map(none));

  showNext$ = combineLatest(this.__arr).pipe(map(any));

  showSettingsStep = computed(() => {
    const serverEntityFinished = this.serverEntityFinished();
    const settingsValid = this.settingsValid();
    return !settingsValid || !serverEntityFinished;
  });

  private setViewerUrl(_id: string) {
    const url = `${environment.viewer_url}${
      environment.viewer_url.endsWith('index.html') ? '' : '/'
    }?mode=upload&entity=${_id}` as string;

    this.viewerUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  ngOnInit() {
    if (this.dialogRef && this.dialogData) {
      const entity = { ...this.dialogData } as IEntity;
      const { relatedDigitalEntity, settings } = entity;
      this.serverEntity.set(entity);
      this.digitalEntity$.next(new DigitalEntity(relatedDigitalEntity));
      console.log('AddEntityWizard DialogData', this.dialogData, relatedDigitalEntity);
      this.entitySettings.set(
        this.dialogData.settings.preview !== '' ? { ...this.dialogData.settings } : undefined,
      );
      this.uploadedFiles.set(this.dialogData.files);
      if (this.stepper) {
        this.stepper.steps.first.interacted = true;
      }

      this.setViewerUrl(this.dialogData._id.toString());
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
        : await firstValueFrom(this.uploadHandler.mediaType$);

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
      creator: this.strippedUser,
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

    this.setViewerUrl(_id);

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
    if (this.isFinishing) {
      console.log('Already trying to finish entity');
      return;
    }
    this.isLinear = true;
    this.isFinishing = true;

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
      this.isFinishing = false;
      this.isFinished = true;
      this.isLinear = true;

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
      this.isFinishing = false;
      this.isLinear = false;
    }
  }

  public publishEntity() {
    const serverEntity = this.serverEntity();
    if (!serverEntity) return;
    serverEntity.online = true;
    this.backend
      .pushEntity(serverEntity)
      .then(updatedEntity => {
        this.isChoosingPublishState = false;
        this.serverEntity.set(updatedEntity);
      })
      .catch(e => {
        console.error(e);
      });
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

  ngOnDestroy() {
    this.uploadHandler.resetQueue(false);
    this.uploadedFiles.set([]);
    this.entitySettings.set(undefined);
    this.serverEntity.set(undefined);
  }
}
