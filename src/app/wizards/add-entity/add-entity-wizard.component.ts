import {
  Component,
  AfterViewInit,
  OnDestroy,
  Optional,
  Inject,
  ViewChild,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatStepper, MatStep } from '@angular/material/stepper';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSelectChange } from '@angular/material/select';
import { FormArray, FormGroup } from '@angular/forms';
import { StepperSelectionEvent } from '@angular/cdk/stepper';
import { Router } from '@angular/router';

import { IUserData, IMetaDataDigitalEntity } from '../../interfaces';
import { AccountService } from '../../services/account.service';
import { UploadHandlerService } from '../../services/upload-handler.service';
import { ObjectIdService } from '../../services/object-id.service';
import { UuidService } from '../../services/uuid.service';
import { SnackbarService } from '../../services/snackbar.service';
import { EventsService } from '../../services/events.service';
import {
  baseAddress,
  baseExternalId,
  baseExternalLink,
  baseDimension,
  baseCreation,
  baseInstitution,
  basePerson,
  baseEntity,
  baseDigital,
  basePhysical,
} from '../../components/metadata/base-objects';
import { MongoHandlerService } from '../../services/mongo-handler.service';
import { ContentProviderService } from '../../services/content-provider.service';
import { showMap } from '../../services/selected-id.service';
import { IEntity, IFile } from '../../interfaces';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-add-entity-wizard',
  templateUrl: './add-entity-wizard.component.html',
  styleUrls: ['./add-entity-wizard.component.scss'],
})
export class AddEntityWizardComponent implements AfterViewInit, OnDestroy {
  @ViewChild('stepper')
  private stepper: MatStepper | undefined;

  public UploadResult: any | undefined;
  public SettingsResult: any | undefined;

  // The entity gets validated inside of the metadata/entity component
  // but we also keep track of validation inside of the wizard
  public entity = (() => {
    const base = baseEntity();
    base.controls = { ...base.controls, ...baseDigital().controls };
    return base;
  })();
  public isEntityValid = false;
  public entityMissingFields: string[] = [];

  public serverEntity: IEntity | undefined;

  // Enable linear after the entity has been finished
  public isLinear = false;
  // While waiting for server responses, block further user interaction
  public isFinishing = false;
  public isFinished = false;

  public isChoosingPublishState = true;

  // Data of the current user, used to load existing digital entities
  public userData: IUserData | undefined;
  public isUserAuthenticated = false;

  public viewerUrl: SafeResourceUrl | undefined;

  // Change detection
  private lastDigitalEntityValue = JSON.stringify(this.entity.getRawValue());
  private digitalEntityTimer: any | undefined;

  constructor(
    public uploadHandler: UploadHandlerService,
    private account: AccountService,
    private uuid: UuidService,
    private mongo: MongoHandlerService,
    private router: Router,
    private content: ContentProviderService,
    private objectId: ObjectIdService,
    private snackbar: SnackbarService,
    private sanitizer: DomSanitizer,
    private events: EventsService,
    // When opened as a dialog
    @Optional() public dialogRef: MatDialogRef<AddEntityWizardComponent>,
    @Optional()
    @Inject(MAT_DIALOG_DATA)
    public dialogData: IEntity | undefined,
  ) {
    this.events.$windowMessage.subscribe(async message => {
      const type = message.data.type;
      switch (type) {
        case 'resetQueue':
          const didQueueReset = await this.uploadHandler.resetQueue();
          if (didQueueReset) {
            this.SettingsResult = undefined;
            this.UploadResult = undefined;
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
          this.SettingsResult = message.data.settings;
          console.log(this.SettingsResult);
          if (this.validateSettings() && this.stepper) {
            this.stepper.selected.interacted = true;
            await this.updateSettings();
            this.stepper.next();
          }
          break;
        default:
          console.log(message.data);
      }
    });

    this.uploadHandler.$UploadResult.subscribe(result => {
      this.UploadResult = result;
    });

    this.account.isUserAuthenticatedObservable.subscribe(
      isUserAuthenticated => (this.isUserAuthenticated = isUserAuthenticated),
    );

    this.account.userDataObservable.subscribe(
      newUserData => (this.userData = newUserData),
    );
    this.entity.valueChanges.subscribe(change => {
      const _stringified = JSON.stringify(change);
      if (this.lastDigitalEntityValue !== _stringified) {
        this.updateDigitalEntityTimer();
        this.lastDigitalEntityValue = _stringified;
      }
    });
  }

  ngAfterViewInit() {
    if (this.dialogRef && this.dialogData) {
      this.serverEntity = this.dialogData as IEntity;
      this.entity = this.content.walkEntity(
        this.dialogData.relatedDigitalEntity as IMetaDataDigitalEntity,
      );
      console.log(this.entity, this.entity.value);
      this.SettingsResult = { ...this.dialogData.settings, status: 'ok' };
      this.UploadResult = { files: this.dialogData.files, status: 'ok' };
      if (this.stepper) {
        this.stepper.steps.first.interacted = true;
      }
    }
  }

  private updateDigitalEntityTimer = () => {
    if (this.digitalEntityTimer) {
      clearTimeout(this.digitalEntityTimer);
    }
    this.digitalEntityTimer = setTimeout(() => {
      // this.updateDigitalEntity();
    }, 10000);
  };

  public uploadBaseEntity = async (stepper: MatStepper) => {
    const mediaType = this.dialogData
      ? this.dialogData.mediaType
      : this.uploadHandler.mediaType;
    const modelExts = ['.babylon', '.obj', '.stl', '.glft', '.glb'];

    const files = (this.UploadResult.files as IFile[])
      .filter(file =>
        mediaType === 'model' || mediaType === 'entity'
          ? modelExts.filter(ext => file.file_name.endsWith(ext)).length > 0 &&
            file.file_format !== ''
          : file.file_format !== '',
      )
      .sort((a, b) => b.file_size - a.file_size);

    const _id = this.objectId.generateEntityId();
    const entity: IEntity = {
      _id,
      name: `Temp-${_id}`,
      annotationList: [],
      files: this.UploadResult.files,
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
        _id: `${this.entity.value._id}`,
      },
      relatedEntityOwners: [],
      whitelist: {
        enabled: false,
        persons: [],
        groups: [],
      },
      processed: {
        raw: files[0].file_link,
        high: files[0].file_link,
        medium: files[Math.floor((files.length * 1) / 3)].file_link,
        low: files[files.length - 1].file_link,
      },
    };

    const serverEntity = await this.mongo
      .pushEntity(entity)
      .then(res => {
        if (res.status === 'ok') {
          return res;
        }
        throw new Error(`Invalid server response: ${JSON.stringify(res)}`);
      })
      .catch(err => {
        return undefined;
        console.error(err);
      });

    if (!serverEntity) {
      console.error(`No serverEntity`, this);
      return;
    }
    this.serverEntity = serverEntity;
    console.log(this.serverEntity);

    const url = environment.kompakkt_url.endsWith('index.html')
      ? (`${environment.kompakkt_url}?mode=upload&entity=${_id}` as string)
      : (`${environment.kompakkt_url}/?mode=upload&entity=${_id}` as string);

    this.viewerUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    stepper.next();
  };

  public updateSettings = async () => {
    if (!this.serverEntity) {
      console.error('No ServerEntity', this);
      return;
    }
    if (!this.SettingsResult) {
      console.error('No settings', this);
      return;
    }
    await this.mongo
      .pushEntity({ ...this.serverEntity, settings: this.SettingsResult })
      .then(result => {
        console.log('Updated settings:', result);
        this.serverEntity = result;
      })
      .catch(err => console.error(err));
  };

  public selectExistingEntity = (event: MatSelectChange) => {
    // Take existing as base but replace all entity _id's
    const entity = event.value;
    entity._id = this.objectId.generateEntityId();

    for (let i = 0; i < entity.phyObjs.length; i++) {
      entity.phyObjs[i]._id = this.objectId.generateEntityId();
    }

    console.log(entity);
    this.entity = this.content.walkEntity(entity);
    console.log(this.entity);
  };

  public validateSettings = () => this.SettingsResult !== undefined;

  // Checks if the upload is finished
  public validateUpload = () =>
    this.UploadResult !== undefined && this.UploadResult.status === 'ok';

  public validateEntity(outputMissing = false) {
    this.entityMissingFields.splice(0, this.entityMissingFields.length);
    this.entity.updateValueAndValidity();

    // Walk over every property of entity
    const invalidControls: string[] = [];
    const errors: string[] = [];
    const recursiveFunc = (form: FormGroup | FormArray) => {
      for (const key in form.controls) {
        const control = form.get(key);
        if (!control) continue;
        control.updateValueAndValidity();
        if (control.errors) {
          for (const error in control.errors) {
            if (!control.errors.hasOwnProperty(error)) continue;
            const message = control.errors[error];
            if (typeof message === 'string') {
              errors.push(message);
            }
          }
        }
        if (control.invalid) invalidControls.push(key);
        if (control instanceof FormGroup) {
          recursiveFunc(control);
        } else if (control instanceof FormArray) {
          recursiveFunc(control);
        }
      }
    };
    recursiveFunc(this.entity);

    this.isEntityValid = this.entity.valid;

    if (outputMissing) {
      errors.forEach(err => this.entityMissingFields.push(err));
      if (this.entity.errors) {
        Object.values(this.entity.errors).forEach(err =>
          this.entityMissingFields.push(err),
        );
      }
      console.log(this.entity, invalidControls, this.entityMissingFields);
      showMap();
      const firstMissing = this.entityMissingFields[0];
      if (firstMissing) {
        this.snackbar.showMessage(firstMissing, 2.5);
      }
    }

    return this.isEntityValid;
  }

  public validationEntityToJSONEntity() {
    const resultEntity = this.content.convertValidationEntityToJSON(
      this.entity,
    );
    return resultEntity;
  }

  public stringify(input: FormGroup) {
    return JSON.stringify(input.getRawValue());
  }

  public getAllOfEntity(property: string) {
    const arr: any[] = [];
    try {
      arr.push(...this.entity.value[property]);
      this.entity.value.phyObjs.forEach(phyObj => {
        arr.push(...phyObj[property]);
      });
    } catch (e) {
      console.warn(
        'Failed getting',
        property,
        'of entity',
        this.entity.value,
        'with error',
        e,
      );
    }
    return arr;
  }

  // Finalize the Entity
  public canFinish() {
    return (
      this.isEntityValid &&
      this.SettingsResult !== undefined &&
      this.UploadResult !== undefined &&
      this.UploadResult.status === 'ok'
    );
  }

  public updateDigitalEntity() {
    if (this.serverEntity && this.serverEntity.finished) {
      console.log('Prevent updating finished entity');
      return;
    }

    const digitalEntity = this.entity.getRawValue();

    this.mongo
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
    console.log(
      'Entity:',
      this.entity,
      'Settings:',
      this.SettingsResult,
      'Upload:',
      this.UploadResult,
    );
    const digitalEntity = this.entity.getRawValue() as IMetaDataDigitalEntity;
    console.log('Sending:', digitalEntity);

    if (this.digitalEntityTimer) {
      clearTimeout(this.digitalEntityTimer);
    }

    this.serverEntity = await this.mongo
      .pushDigitalEntity(digitalEntity)
      .then(result => {
        if (result.status === 'error') {
          throw new Error(result.message);
        }
        console.log('Got DigitalEntity from server:', result);
        if (Object.keys(result).length < 3) {
          throw new Error('Incomplete digital entity received from server');
        }

        if (!this.serverEntity) {
          throw new Error('No serverEntity');
        }

        // Set finished and un-published
        let entity = this.serverEntity;
        entity.settings = this.SettingsResult;
        entity.finished = true;
        entity.online = false;

        if (this.dialogRef && this.dialogData) {
          // Overwrite with data from MatDialog if editing existing entity
          entity = {
            ...this.dialogData,
            ...entity,
            _id: this.dialogData._id,
            finished: this.dialogData.finished,
            online: this.dialogData.online,
            whitelist: this.dialogData.whitelist,
            annotationList: this.dialogData.annotationList,
            relatedEntityOwners: this.dialogData.relatedEntityOwners,
          };
        }

        // Update name and relatedDigitalEntity
        entity.name = result.title;
        entity.relatedDigitalEntity = { _id: result._id };

        console.log('Saving entity to server:', entity);
        return entity;
      })
      .then(entity => this.mongo.pushEntity(entity))
      .then(result => {
        console.log('Saved entity to server', result);
        return result;
      })
      .catch(e => {
        console.error(e);
        return undefined;
      });

    if (this.serverEntity) {
      this.isFinishing = false;
      this.isFinished = true;
      this.isLinear = true;

      lastStep.completed = true;
      stepper.next();
      stepper._steps.forEach(step => (step.editable = false));

      if (this.dialogRef && this.dialogData) {
        console.log(
          'Updated entity via dialog:',
          this.serverEntity,
          digitalEntity,
        );
      }

      this.navigateToFinishedEntity();
    } else {
      // TODO: Error handling
      this.isFinishing = false;
      this.isLinear = false;
    }
  }

  public publishEntity() {
    if (this.serverEntity) {
      this.serverEntity.online = true;
      this.mongo
        .pushEntity(this.serverEntity)
        .then(updatedEntity => {
          this.isChoosingPublishState = false;
          if (updatedEntity.status === 'ok') {
            // TODO: alert user that publishing was success
            this.serverEntity = updatedEntity;
          } else {
            throw new Error(
              `Failed updating entity: ${JSON.stringify(updatedEntity)}`,
            );
          }
        })
        .catch(e => {
          console.error(e);
        });
    }
  }

  public navigateToFinishedEntity() {
    if (this.serverEntity) {
      this.router
        .navigate([`/entity/${this.serverEntity._id}`])
        .then(() => {
          if (this.dialogRef) {
            this.dialogRef.close(undefined);
            this.content.updateContent();
          }
        })
        .catch(e => console.error(e));
    }
  }

  // Steps require interaction before they can be completed
  // but some steps might be correct out of the box.
  // mark steps as interacted with on selection
  public stepInteraction(event: StepperSelectionEvent) {
    event.selectedStep.interacted = true;
  }

  ngOnDestroy() {
    this.uploadHandler.resetQueue(false);
    this.UploadResult = undefined;
    this.SettingsResult = undefined;
    this.serverEntity = undefined;
  }
}