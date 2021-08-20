import { Component, OnInit, OnDestroy, Optional, Inject, ViewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatStepper, MatStep } from '@angular/material/stepper';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormControl } from '@angular/forms';
import { StepperSelectionEvent } from '@angular/cdk/stepper';
import { Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { BehaviorSubject, combineLatest, firstValueFrom } from 'rxjs';
import fscreen from 'fscreen';

import { IEntity, IFile, IEntitySettings, IStrippedUserData, ObjectId } from 'src/common';
import { DigitalEntity } from '~metadata';
import {
  AccountService,
  UploadHandlerService,
  modelExts,
  UuidService,
  EventsService,
  BackendService,
  ContentProviderService,
} from 'src/app/services';
import { environment } from 'src/environments/environment';

const any = (arr: any[]) => arr.some(obj => !!obj);
const all = (arr: any[]) => arr.every(obj => !!obj);
const none = (arr: any[]) => !any(arr);

@Component({
  selector: 'app-add-entity-wizard',
  templateUrl: './add-entity-wizard.component.html',
  styleUrls: ['./add-entity-wizard.component.scss'],
})
export class AddEntityWizardComponent implements OnInit, OnDestroy {
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

  private uploadedFiles = new BehaviorSubject<IFile[]>([]);
  private entitySettings = new BehaviorSubject<IEntitySettings | undefined>(undefined);
  private digitalEntity = new BehaviorSubject(new DigitalEntity());
  private serverEntity = new BehaviorSubject<IEntity | undefined>(undefined);

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

  constructor(
    public uploadHandler: UploadHandlerService,
    private account: AccountService,
    private uuid: UuidService,
    private backend: BackendService,
    private router: Router,
    private content: ContentProviderService,
    private sanitizer: DomSanitizer,
    private events: EventsService,
    // When opened as a dialog
    @Optional() public dialogRef: MatDialogRef<AddEntityWizardComponent>,
    @Optional()
    @Inject(MAT_DIALOG_DATA)
    public dialogData: IEntity | undefined,
  ) {
    this.account.isAuthenticated$.subscribe(isAuthenticated => {
      if (!isAuthenticated) this.dialogRef.close('User is not authenticated');
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
            this.entitySettings.next(undefined);
            this.uploadedFiles.next([]);
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
          this.entitySettings.next(message.data.settings);
          console.log(this.entitySettings.value);
          if (!!this.entitySettings.value && this.stepper?.selected) {
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
      this.uploadedFiles.next(result);
    });

    /*this.entity.valueChanges.subscribe(change => {
      const _stringified = JSON.stringify(change);
      if (this.lastDigitalEntityValue !== _stringified) {
        this.updateDigitalEntityTimer();
        this.lastDigitalEntityValue = _stringified;
      }
    });*/
  }

  get maxWidth() {
    if (this.stepper?.selected?.label === 'Settings') return '80rem';
    if (this.stepper?.selected?.label === 'Metadata') return '60rem';
    return '50rem';
  }

  get isUploading$() {
    return this.uploadHandler.isUploading$;
  }

  get uploadCompleted$() {
    return this.uploadHandler.uploadCompleted$;
  }

  get isQueueEmpty$() {
    return this.uploadHandler.isEmpty$;
  }

  get queueHasItems$() {
    return this.isQueueEmpty$.pipe(map(v => !v));
  }

  get digitalEntity$() {
    return this.digitalEntity.asObservable();
  }

  get entitySettings$() {
    return this.entitySettings.asObservable();
  }

  get uploadedFiles$() {
    return this.uploadedFiles.asObservable();
  }

  get serverEntityFinished$() {
    return this.serverEntity.pipe(map(serverEntity => !!serverEntity?.finished));
  }

  get digitalEntityValid$() {
    return this.digitalEntity$.pipe(map(entity => DigitalEntity.checkIsValid(entity)));
  }

  get settingsValid$() {
    return this.entitySettings.pipe(map(settings => !!settings));
  }

  get uploadValid$() {
    return this.uploadedFiles.pipe(
      map(files => !!files && Array.isArray(files) && files.length > 0),
    );
  }

  get externalFileValid() {
    return this.externalFileControl.valid && !!this.externalFileControl.value;
  }

  get canFinish$() {
    return combineLatest([this.digitalEntityValid$, this.settingsValid$, this.uploadValid$]).pipe(
      map(all),
    );
  }

  get isAuthenticated$() {
    return this.account.isAuthenticated$;
  }

  // Control buttons
  get __arr() {
    return [this.isUploading$, this.uploadCompleted$];
  }

  get canCancel$() {
    return combineLatest([...this.__arr, this.queueHasItems$]).pipe(map(any));
  }

  get canBeginUpload$() {
    return combineLatest([...this.__arr, this.isQueueEmpty$]).pipe(map(none));
  }

  get showBeginUpload$() {
    return combineLatest(this.__arr).pipe(map(none));
  }

  get showNext$() {
    return combineLatest(this.__arr).pipe(map(any));
  }

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
      this.serverEntity.next(entity);
      this.digitalEntity.next(new DigitalEntity(relatedDigitalEntity));
      console.log(this.dialogData, relatedDigitalEntity);
      this.entitySettings.next(
        this.dialogData.settings.preview !== '' ? { ...this.dialogData.settings } : undefined,
      );
      this.uploadedFiles.next(this.dialogData.files);
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
    const uploadedFiles = this.uploadedFiles.value;

    const mediaType =
      this.dialogData?.mediaType ?? this.externalFileValid
        ? this.uploadHandler.determineMediaType([externalFile])
        : await firstValueFrom(this.uploadHandler.mediaType$);

    if (uploadedFiles.length === 0 && !this.externalFileValid) {
      throw new Error('No uploaded files found');
    }

    if (!mediaType) {
      throw new Error('Could not determine type of uploaded files');
    }

    const _id = new ObjectId().toString();
    const entity: IEntity = {
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
      dataSource: {
        isExternal: false,
        service: 'kompakkt',
      },
      relatedDigitalEntity: {
        _id: `${this.digitalEntity.value._id}`,
      },
      whitelist: {
        enabled: false,
        persons: [],
        groups: [],
      },
      processed: {
        raw: '',
        high: '',
        medium: '',
        low: '',
      },
    };

    // If files were uploaded, add them
    const files = this.uploadedFiles.value
      .filter(file =>
        mediaType === 'model' || mediaType === 'entity'
          ? modelExts.filter(ext => file.file_name.toLowerCase().endsWith(ext)).length > 0 &&
            file.file_format !== ''
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
      console.error(`No serverEntity`, this);
      return;
    }
    this.serverEntity.next(serverEntity);
    console.log(this.serverEntity);

    this.setViewerUrl(_id);

    // this.entity.objecttype = mediaType;
    this.digitalEntity.value.type = mediaType;
    stepper.next();
  }

  public async updateSettings() {
    const serverEntity = this.serverEntity.value;
    const settings = this.entitySettings.value;
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
        this.serverEntity.next(result);
      })
      .catch(err => console.error(err));
  }

  public updateDigitalEntity() {
    if (this.serverEntity.value?.finished) {
      console.log('Prevent updating finished entity');
      return;
    }

    const digitalEntity = this.digitalEntity.value;

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

    const digitalEntity = this.digitalEntity.value;
    const settings = this.entitySettings.value;
    const files = this.uploadedFiles.value;

    if (!settings) return;

    console.log('Entity:', digitalEntity, 'Settings:', settings, 'Upload:', files);
    console.log('Sending:', digitalEntity);

    /*if (this.digitalEntityTimer) {
      clearTimeout(this.digitalEntityTimer);
    }*/

    const serverEntityResult = await this.backend
      .pushDigitalEntity(digitalEntity)
      .then(result => {
        console.log('Got DigitalEntity from server:', result);
        if (Object.keys(result).length < 3) {
          throw new Error('Incomplete digital entity received from server');
        }

        const serverEntity = this.serverEntity.value;
        if (!serverEntity) {
          throw new Error('No serverEntity');
        }

        // Set finished and un-published
        let entity = serverEntity;
        entity.settings = settings;
        entity.finished = true;
        entity.online = false;

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

    this.serverEntity.next(serverEntityResult);

    if (this.serverEntity.value) {
      this.isFinishing = false;
      this.isFinished = true;
      this.isLinear = true;

      lastStep.completed = true;
      stepper.next();
      stepper._steps.forEach(step => (step.editable = false));

      if (this.dialogRef && this.dialogData) {
        console.log('Updated entity via dialog:', this.serverEntity, digitalEntity);
      }

      // Refresh account data
      await this.account.fetchUserData();

      this.navigateToFinishedEntity();
    } else {
      // TODO: Error handling
      this.isFinishing = false;
      this.isLinear = false;
    }
  }

  public publishEntity() {
    if (!this.serverEntity.value) return;
    this.serverEntity.value.online = true;
    this.backend
      .pushEntity(this.serverEntity.value)
      .then(updatedEntity => {
        this.isChoosingPublishState = false;
        this.serverEntity.next(updatedEntity);
      })
      .catch(e => {
        console.error(e);
      });
  }

  public navigateToFinishedEntity() {
    if (!this.serverEntity.value) return;
    this.router
      .navigate([`/entity/${this.serverEntity.value._id}`])
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

  ngOnDestroy() {
    this.uploadHandler.resetQueue(false);
    this.uploadedFiles.next([]);
    this.entitySettings.next(undefined);
    this.serverEntity.next(undefined);
  }
}
