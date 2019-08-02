import { Component, AfterViewInit, ViewChild } from '@angular/core';
import { MatStepper, MatStep } from '@angular/material';
import { StepperSelectionEvent } from '@angular/cdk/stepper';
import { Router } from '@angular/router';

import { UploadHandlerService } from '../../services/upload-handler.service';
import { UuidService } from '../../services/uuid.service';
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
  basePlace,
} from '../metadata/base-objects';
import { MongoHandlerService } from '../../services/mongo-handler.service';
import { IEntity, IFile } from '../../interfaces';
import { mock } from '../../../assets/mock';

@Component({
  selector: 'app-wizard',
  templateUrl: './wizard.component.html',
  styleUrls: ['./wizard.component.scss'],
})
export class WizardComponent implements AfterViewInit {
  // Controlling the stepper
  @ViewChild('stepper', { static: false })
  stepper: MatStepper | undefined;
  @ViewChild('stepUpload', { static: false })
  stepUpload: MatStep | undefined;
  @ViewChild('stepMetadata', { static: false })
  stepMetadata: MatStep | undefined;
  @ViewChild('stepFinalize', { static: false })
  stepFinalize: MatStep | undefined;
  @ViewChild('stepPublish', { static: false })
  stepPublish: MatStep | undefined;

  public UploadResult: any | undefined = JSON.parse(mock.upload);
  public SettingsResult: any | undefined = JSON.parse(mock.settings);

  // The entity gets validated inside of the metadata/entity component
  // but we also keep track of validation inside of the wizard
  public entity = { ...baseEntity(), ...baseDigital() };
  public isEntityValid = false;
  public entityMissingFields: string[] = [];

  public serverEntity: IEntity | undefined;

  // Enable linear after the entity has been finished
  public isLinear = false;
  // While waiting for server responses, block further user interaction
  public isFinishing = false;
  public isFinished = false;

  public isChoosingPublishState = true;

  constructor(
    public uploadHandler: UploadHandlerService,
    private uuid: UuidService,
    private mongo: MongoHandlerService,
    private router: Router,
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

    this.JSONEntityToValidationEntity();

    this.uploadHandler.$UploadResult.subscribe(
      result => (this.UploadResult = result),
    );
  }

  ngAfterViewInit() {
    if (this.stepper) {
      this.stepper.selectionChange.subscribe((next: StepperSelectionEvent) => {
        if (!this.stepper) return;
        console.log(this.stepper, next);
      });
    }
  }

  public validateUpload = () =>
    this.UploadResult !== undefined && this.UploadResult.status === 'ok';

  public validateEntity() {
    console.log('Validating entity:', this.entity);
    this.entityMissingFields.splice(0, this.entityMissingFields.length);
    let isValid = true;

    const validateObject = (obj: any) => {
      for (const property in obj) {
        if (!obj.hasOwnProperty(property)) {
          continue;
        }
        const current = obj[property];
        const value = current.value;
        const isRequired = current.required;
        const isArray = Array.isArray(value);
        const isString = typeof value;
        // Skip non-required strings
        // Additional Typechecking is in place because
        // we are not using any TypeScript checking here
        if (!isRequired && !isArray && isString) {
          continue;
        }

        // If we have an array, walk over its entries
        if (isArray) {
          const isEmpty = (value as any[]).length === 0;
          // Check for isEmpty and isRequired
          // because there are optional arrays that can contain
          // objects that _are_ required
          if (isEmpty && isRequired) {
            this.entityMissingFields.push(`${property} can't be empty`);
            isValid = false;
          } else {
            for (const element of value as any[]) {
              validateObject(element);
            }
          }
        } else if (isString) {
          const isEmpty =
            (value as string).length === 0 || (value as string) === '';
          if (isEmpty) {
            this.entityMissingFields.push(`${property} can't be empty`);
            isValid = false;
          }
        } else {
          console.log('Unknown hit in validation', property, current);
        }
      }
    };

    // Walk over every property of entity
    validateObject(this.entity);
    this.isEntityValid = isValid;
    console.log('Invalid fields on entity:', this.entityMissingFields);
    this.validationEntityToJSONEntity();
    return this.isEntityValid;
  }

  public validationEntityToJSONEntity() {
    const walk = (obj: any) => {
      const resultObj: any = {};
      if (typeof obj === 'string') {
        return obj;
      }

      for (const prop in obj) {
        if (!obj.hasOwnProperty(prop)) {
          continue;
        }
        const current = obj[prop];
        const value = obj[prop].value;
        const isArray = Array.isArray(value);
        const isString = typeof value === 'string';

        if (!isArray && isString) {
          resultObj[prop] = value;
        } else if (isArray && !isString) {
          resultObj[prop] = (value as any[]).map(walk);
        } else {
          switch (prop) {
            case 'address':
            case 'place':
              resultObj[prop] = walk(value);
              break;
            default:
              console.log(
                'Unkown hit in conversion',
                current,
                prop,
                obj,
                obj[prop],
              );
          }
        }
      }
      return resultObj;
    };

    const resultEntity = walk(this.entity);
    console.log('Validation entity converted to JSON:', resultEntity);
    return resultEntity;
  }

  public JSONEntityToValidationEntity() {
    const _parsed = JSON.parse(mock.json);

    // Helper function to fill an array with length of 'length'
    // with the resulting base validation object of 'func'
    const arrBase = (func: () => any, valArr: any[]) => {
      const arr = new Array(valArr.length);
      for (let i = 0; i < valArr.length; i++) {
        arr[i] = walkSimple(valArr[i], func);
      }
      return arr;
    };

    // Walk simple object types, e.g. person, institution, link, id...
    const walkSimple = (parsed: any, func: () => any) => {
      const newSimple = { ...func() };
      for (const prop in parsed) {
        if (!parsed.hasOwnProperty(prop)) {
          continue;
        }

        const value = parsed[prop];
        const isArray = Array.isArray(value);
        const isString = typeof value === 'string';
        if (!isArray && isString) {
          newSimple[prop].value = value;
        } else if (isArray && !isString) {
          switch (prop) {
            case 'institution':
              newSimple[prop].value = arrBase(baseInstitution, value);
              break;
            default:
              // Assume string array
              newSimple[prop].value = value;
          }
        } else {
          switch (prop) {
            case 'address':
              newSimple[prop].value = walkSimple(value, baseAddress);
              break;
            case 'place':
            default:
              console.log('Unknown hit in simple', prop, value, parsed);
          }
        }
      }
      return newSimple;
    };

    // Walk digital or physical entities, which are the 2 top level types
    const walkEntity = (parsed: any, isPhysical = false) => {
      // Base to be overwritten
      const newBase = isPhysical
        ? { ...baseEntity(), ...basePhysical() }
        : { ...baseEntity(), ...baseDigital() };

      for (const prop in parsed) {
        if (!parsed.hasOwnProperty(prop)) {
          continue;
        }

        const value = parsed[prop];
        const isArray = Array.isArray(value);
        const isString = typeof value === 'string';
        if (!isArray && isString) {
          newBase[prop].value = value;
        } else if (isArray && !isString) {
          const valArr: any[] = value as any[];
          const len = valArr.length;
          switch (prop) {
            case 'externalId':
              newBase[prop].value = arrBase(baseExternalId, valArr);
              break;
            case 'externalLink':
              newBase[prop].value = arrBase(baseExternalLink, valArr);
              break;
            case 'persons':
              newBase[prop].value = arrBase(basePerson, valArr);
              break;
            case 'institutions':
              newBase[prop].value = arrBase(baseInstitution, valArr);
              break;
            case 'dimensions':
              newBase[prop].value = arrBase(baseDimension, valArr);
              break;
            case 'creation':
              newBase[prop].value = arrBase(baseCreation, valArr);
              break;
            case 'phyObjs':
              newBase[prop].value = new Array(len);
              for (let i = 0; i < len; i++) {
                newBase[prop].value[i] = walkEntity(valArr[i], true);
              }
              break;
            default:
              newBase[prop].value = value;
          }
        } else {
          switch (prop) {
            case 'place':
              newBase[prop] = {
                required: false,
                value: walkSimple(value, basePlace),
              };
              break;
            default:
              console.log('Unknown hit in parsing', prop, value);
          }
        }
      }
      return newBase;
    };

    const _base = walkEntity(_parsed);
    console.log('JSON entity parsed to validation Entity:', _base);
    this.entity = (_base as unknown) as any;
    this.validateEntity();
  }

  public debug(event: any) {
    console.log(event, this);
  }

  public stringify(input: any) {
    return JSON.stringify(input);
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

  public async tryFinish() {
    if (this.isFinishing) {
      console.log('Already trying to finish entity');
      return;
    }
    this.isLinear = true;
    this.isFinishing = true;
    console.log(this.entity, this.SettingsResult, this.UploadResult);
    const digitalEntity = { ...this.validationEntityToJSONEntity() };
    this.serverEntity = await this.mongo
      .pushDigitalEntity(digitalEntity)
      .then(result => {
        console.log('Got DigitalEntity from server:', result);
        const files = (this.UploadResult.files as IFile[]).sort(
          (a, b) => b.file_size - a.file_size,
        );
        const entity: IEntity = {
          _id: '',
          name: result.title,
          annotationList: [],
          files: this.UploadResult.files,
          settings: this.SettingsResult,
          finished: true,
          online: false,
          mediaType: this.uploadHandler.mediaType,
          dataSource: { isExternal: false },
          relatedDigitalEntity: {
            _id: result._id,
          },
          processed: {
            raw: files[0].file_link,
            high: files[Math.floor((files.length * 1) / 3)].file_link,
            medium: files[Math.floor((files.length * 2) / 3)].file_link,
            low: files[files.length - 1].file_link,
          },
        };
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
      this.finishStepperSteps();
    } else {
      // TODO: Error handling
      this.isFinishing = false;
      this.isLinear = false;
    }
  }

  // Prevent user from going back after upload has finished
  // and force steps to true, so moving on to the 4th step works
  public finishStepperSteps() {
    if (!this.stepper) return;
    if (this.stepUpload) {
      this.stepUpload.completed = true;
      this.stepUpload.interacted = true;
      this.stepUpload.editable = false;
    }
    if (this.stepMetadata) {
      this.stepMetadata.completed = true;
      this.stepMetadata.interacted = true;
      this.stepMetadata.editable = false;
    }
    if (this.stepFinalize) {
      this.stepFinalize.completed = true;
      this.stepFinalize.interacted = true;
      this.stepFinalize.editable = false;
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
        .navigate([`/object/${this.serverEntity._id}`])
        .then(() => {})
        .catch(e => console.error(e));
    }
  }
}
