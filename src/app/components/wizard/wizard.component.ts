import { Component, AfterViewInit } from '@angular/core';

import { UploadHandlerService } from '../../services/upload-handler.service';
import { UuidService } from '../../services/uuid.service';
import { baseAddress, baseExternalId, baseExternalLink, baseDimension, baseCreation, baseInstitution, basePerson, baseEntity, baseDigital, basePhysical, basePlace } from '../metadata/base-objects';

@Component({
  selector: 'app-wizard',
  templateUrl: './wizard.component.html',
  styleUrls: ['./wizard.component.scss'],
})
export class WizardComponent implements AfterViewInit {

  public UploadResult: any | undefined;
  public SettingsResult: any | undefined;

  // The entity gets validated inside of the metadata/entity component
  // but we also keep track of validation inside of the wizard
  public entity = { ...baseEntity(), ...baseDigital() };
  public isEntityValid = false;
  public entityMissingFields: string[] = [];

  constructor(public uploadHandler: UploadHandlerService, private uuid: UuidService) {
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
        case 'addFile': this.uploadHandler.addToQueue(message.data.file); break;
        case 'fileList':
          console.log(message.data);
          this.uploadHandler.addMultipleToQueue(message.data.files);
          this.uploadHandler.setMediaType(message.data.mediaType);
          break;
        case 'settings': this.SettingsResult = message.data.settings; break;
        default: console.log(message.data);
      }
    };

    this.JSONEntityToValidationEntity();

    this.uploadHandler.$UploadResult.subscribe(result => this.UploadResult = result);
  }

  ngAfterViewInit() {
  }

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
            for (const element of (value as any[])) {
              validateObject(element);
            }
          }
        } else if (isString) {
          const isEmpty = (value as string).length === 0 || (value as string) === '';
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
              console.log('Unkown hit in conversion', current, prop, obj, obj[prop]);
          }
        }
      }
      return resultObj;
    };

    const resultEntity = walk(this.entity);
    console.log('Validation entity converted to JSON:', resultEntity);
  }

  public JSONEntityToValidationEntity() {
    const mock = `{"_id":"","title":"tit","description":"desc","externalId":[{"type":"extid","value":"extid"}],"externalLink":[{"description":"extlink","value":"extlink"}],"metadata_files":[],"persons":[{"name":"pers","prename":"pers","mail":"pers","role":["RIGHTS_OWNER","CONTACT_PERSON"],"note":"pesrn","phonenumber":"pesrno","institution":[{"name":"nested inst","address":{"building":"nested inst","number":"nested inst","street":"nested inst","postcode":"nested inst","city":"nested inst","country":"nested inst"},"role":["RIGHTS_OWNER","EDITOR"],"university":"nested inst","note":"nested inst"}]}],"institutions":[{"name":"inst","address":{"building":"inst","number":"inst","street":"inst","postcode":"inst","city":"inst","country":"inst"},"role":["DATA_CREATOR","CONTACT_PERSON"],"university":"inst","note":"inst"}],"type":"digtyp","licence":"BY","discipline":["disc"],"tags":["tag"],"dimensions":[{"type":"dim","value":"dim","name":"dim"}],"creation":[{"technique":"cre","program":"cre","equipment":"cre","date":"cre"}],"files":[],"statement":"digstat","objecttype":"","phyObjs":[{"_id":"","title":"phytit","description":"phydesc","externalId":[{"type":"phyextid","value":"phyextid"}],"externalLink":[{"description":"phyextlink","value":"phyextlink"}],"metadata_files":[],"persons":[{"name":"phypers","prename":"phypers","mail":"phypers","role":["RIGHTS_OWNER","CONTACT_PERSON"],"note":"phypers","phonenumber":"phypers","institution":[{"name":"phypers nested inst","address":{"building":"phypers nested inst","number":"phypers nested inst","street":"phypers nested inst","postcode":"phypers nested inst","city":"phypers nested inst","country":"phypers nested inst"},"role":["EDITOR","DATA_CREATOR"],"university":"phypers nested inst","note":"phypers nested inst"}]}],"institutions":[{"name":"phyinst","address":{"building":"phyinst","number":"phyinst","street":"phyinst","postcode":"phyinst","city":"phyinst","country":"phyinst"},"role":["RIGHTS_OWNER","CREATOR","EDITOR","DATA_CREATOR","CONTACT_PERSON"],"university":"phyinst","note":"phyinst"}],"place":{"name":"phypl","geopolarea":"phygeo","address":{"building":"phyaddr","number":"phyaddr","street":"phyaddr","postcode":"phyaddr","city":"phyaddr","country":"phyaddr"}},"collection":"phycol"}]}`;
    const _parsed = JSON.parse(mock);

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
      const newSimple = {...func()};
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
          const valArr: any[] = (value as any[]);
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
            default: newBase[prop].value = value;
          }
        } else {
          switch (prop) {
            case 'place':
              newBase[prop] = {
                required: false,
                value: walkSimple(value, basePlace),
              };
              break;
            default: console.log('Unknown hit in parsing', prop, value);
          }
        }
      }
      return newBase;
    };

    const _base = walkEntity(_parsed);
    console.log('JSON entity parsed to validation Entity:', _base);
    setTimeout(() => {
      this.entity = (_base as unknown as any);
      console.log('Overwritten entity', this.entity);
    }, 0);
  }

  public debug(event: any) {
    console.log(event, this);
  }

  public stringify(input: any) {
    return JSON.stringify(input);
  }

}
