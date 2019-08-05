import { Injectable } from '@angular/core';

import { MongoHandlerService } from './mongo-handler.service';
import {
  IEntity,
  IMetaDataPerson,
  IMetaDataInstitution,
  IMetaDataTag,
} from '../interfaces';
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
} from '../components/metadata/base-objects';

@Injectable({
  providedIn: 'root',
})
export class ContentProviderService {
  // Existing Server data
  private ServerPersons: IMetaDataPerson[] = [];
  private ServerInstitutions: IMetaDataInstitution[] = [];
  private ServerTags: IMetaDataTag[] = [];

  constructor(private mongo: MongoHandlerService) {
    // TODO: refetch on some occasions, e.g. after wizard completion
    this.mongo
      .getAllPersons()
      .then(result => (this.ServerPersons = result))
      .catch(() => {});

    this.mongo
      .getAllInstitutions()
      .then(result => (this.ServerInstitutions = result))
      .catch(() => {});

    this.mongo
      .getAllTags()
      .then(result => (this.ServerTags = result))
      .catch(() => {});
  }

  public getPersons = () => this.ServerPersons;
  public getInstitutions = () => this.ServerInstitutions;
  public getTags = () => this.ServerTags;

  // Helper function to fill an array with length of 'length'
  // with the resulting base validation object of 'func'
  private arrBase = (func: () => any, valArr: any[]) => {
    const arr = new Array(valArr.length);
    for (let i = 0; i < valArr.length; i++) {
      arr[i] = this.walkSimple(valArr[i], func);
    }
    return arr;
  };

  // Walk simple object types, e.g. person, institution, link, id...
  public walkSimple = (parsed: any, func: () => any) => {
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
            newSimple[prop].value = this.arrBase(baseInstitution, value);
            break;
          default:
            // Assume string array
            newSimple[prop].value = value;
        }
      } else {
        switch (prop) {
          case 'address':
            newSimple[prop].value = this.walkSimple(value, baseAddress);
            break;
          case 'roles':
            newSimple[prop] = {
              required: false,
              value,
            };
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
  public walkEntity = (jsonEntity: any, isPhysical = false) => {
    // Base to be overwritten
    const newBase = isPhysical
      ? { ...baseEntity(), ...basePhysical() }
      : { ...baseEntity(), ...baseDigital() };

    for (const prop in jsonEntity) {
      if (!jsonEntity.hasOwnProperty(prop)) {
        continue;
      }

      const value = jsonEntity[prop];
      const isArray = Array.isArray(value);
      const isString = typeof value === 'string';
      if (!isArray && isString) {
        newBase[prop].value = value;
      } else if (isArray && !isString) {
        const valArr: any[] = value as any[];
        const len = valArr.length;
        switch (prop) {
          case 'externalId':
            newBase[prop].value = this.arrBase(baseExternalId, valArr);
            break;
          case 'externalLink':
            newBase[prop].value = this.arrBase(baseExternalLink, valArr);
            break;
          case 'persons':
            newBase[prop].value = this.arrBase(basePerson, valArr);
            break;
          case 'institutions':
            newBase[prop].value = this.arrBase(baseInstitution, valArr);
            break;
          case 'dimensions':
            newBase[prop].value = this.arrBase(baseDimension, valArr);
            break;
          case 'creation':
            newBase[prop].value = this.arrBase(baseCreation, valArr);
            break;
          case 'phyObjs':
            newBase[prop].value = new Array(len);
            for (let i = 0; i < len; i++) {
              newBase[prop].value[i] = this.walkEntity(valArr[i], true);
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
              value: this.walkSimple(value, basePlace),
            };
            break;
          default:
            console.log('Unknown hit in parsing', prop, value);
        }
      }
    }
    return newBase;
  };

  public convertValidationEntityToJSON(entity: any) {
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
            case 'roles':
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
    return walk(entity);
  }
}
