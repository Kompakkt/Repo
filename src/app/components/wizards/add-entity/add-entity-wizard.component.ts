import {
  Component,
  AfterViewInit,
  Optional,
  Inject,
  ViewChild,
} from '@angular/core';
import {
  MatStepper,
  MatStep,
  MatSelectChange,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material';
import { FormArray, FormGroup } from '@angular/forms';
import { StepperSelectionEvent } from '@angular/cdk/stepper';
import { Router } from '@angular/router';

import { ILDAPData, IMetaDataDigitalEntity } from '../../../interfaces';
import { AccountService } from '../../../services/account.service';
import { UploadHandlerService } from '../../../services/upload-handler.service';
import { ObjectIdService } from '../../../services/object-id.service';
import { UuidService } from '../../../services/uuid.service';
import { SnackbarService } from '../../../services/snackbar.service';
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
} from '../../metadata/base-objects';
import { MongoHandlerService } from '../../../services/mongo-handler.service';
import { ContentProviderService } from '../../../services/content-provider.service';
import { showMap } from '../../../services/selected-id.service';
import { IEntity, IFile } from '../../../interfaces';
import { mock } from '../../../../assets/mock';

@Component({
  selector: 'app-add-entity-wizard',
  templateUrl: './add-entity-wizard.component.html',
  styleUrls: ['./add-entity-wizard.component.scss'],
})
export class AddEntityWizardComponent implements AfterViewInit {
  @ViewChild('stepper', { static: false }) private stepper:
    | MatStepper
    | undefined;

  // public UploadResult: any | undefined = JSON.parse(mock.upload);
  public UploadResult: any | undefined;
  // public SettingsResult: any | undefined = JSON.parse(mock.settings);
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
  public userData: ILDAPData | undefined;

  constructor(
    public uploadHandler: UploadHandlerService,
    private account: AccountService,
    private uuid: UuidService,
    private mongo: MongoHandlerService,
    private router: Router,
    private content: ContentProviderService,
    private objectId: ObjectIdService,
    private snackbar: SnackbarService,
    // When opened as a dialog
    @Optional() public dialogRef: MatDialogRef<AddEntityWizardComponent>,
    @Optional()
    @Inject(MAT_DIALOG_DATA)
    public dialogData: IEntity | undefined,
  ) {
    window.onmessage = async message => {
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
          break;
        default:
          console.log(message.data);
      }
    };

    this.uploadHandler.$UploadResult.subscribe(
      result => (this.UploadResult = result),
    );

    this.account.userDataObservable.subscribe(
      newUserData => (this.userData = newUserData),
    );
  }

  ngAfterViewInit() {
    if (this.dialogRef && this.dialogData) {
      this.entity = this.content.walkEntity(this.dialogData
        .relatedDigitalEntity as IMetaDataDigitalEntity);
      console.log(this.entity, this.entity.value);
      this.SettingsResult = { ...this.dialogData.settings, status: 'ok' };
      this.UploadResult = { files: this.dialogData.files, status: 'ok' };
      if (this.stepper) {
        this.stepper.steps.first.interacted = true;
      }
    }
  }

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

  // Checks if the upload has been started and settings have been set
  public validateUploadStep = () =>
    this.SettingsResult !== undefined &&
    (this.uploadHandler.isUploading || this.uploadHandler.uploadCompleted);

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
    const digitalEntity = this.entity.getRawValue();
    console.log('Sending:', digitalEntity);
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
        const mediaType = this.dialogData
          ? this.dialogData.mediaType
          : this.uploadHandler.mediaType;
        const modelExts = ['.babylon', '.obj', '.stl', '.glft', '.glb'];

        const files = (this.UploadResult.files as IFile[])
          .filter(file =>
            mediaType === 'model' || mediaType === 'entity'
              ? modelExts.filter(ext => file.file_name.endsWith(ext)).length > 0
              : true,
          )
          .sort((a, b) => b.file_size - a.file_size);
        let entity: IEntity = {
          _id: '',
          name: result.title,
          annotationList: [],
          files: this.UploadResult.files,
          settings: this.SettingsResult,
          finished: true,
          online: false,
          mediaType,
          dataSource: {
            isExternal: false,
            service: 'kompakkt',
          },
          relatedDigitalEntity: {
            _id: result._id,
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

        if (this.dialogRef && this.dialogData) {
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
        console.log(this.serverEntity, digitalEntity);
        this.dialogRef.close(this.serverEntity);
      }
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
        .then(() => {})
        .catch(e => console.error(e));
    }
  }

  // Steps require interaction before they can be completed
  // but some steps might be correct out of the box.
  // mark steps as interacted with on selection
  public stepInteraction(event: StepperSelectionEvent) {
    event.selectedStep.interacted = true;
  }
}
