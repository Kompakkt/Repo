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
  baseContactReference,
  baseInstitution,
  basePerson,
  baseEntity,
  baseDigital,
  basePhysical,
  basePlace,
  optionalString,
  optionalObject,
  optionalArray,
  requiredObject,
  requiredString,
  requiredArray,
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

  public walkInstitution = (
    parsed: IMetaDataInstitution,
    relatedEntityId: string,
  ) => {
    const newInstitution = { ...baseInstitution(relatedEntityId) };
    newInstitution._id.value = parsed._id;
    newInstitution.name.value = parsed.name;
    newInstitution.university.value = parsed.university;

    for (const id in parsed.addresses) {
      newInstitution.addresses.value[id] = requiredObject();
      newInstitution.addresses.value[id].value = this.walkSimple(
        parsed.addresses[id],
        baseAddress,
      );
    }

    for (const id in parsed.notes) {
      newInstitution.notes.value[id] = optionalString();
      newInstitution.notes.value[id].value = parsed.notes[id];
    }

    for (const id in parsed.roles) {
      newInstitution.roles.value[id] = requiredArray();
      newInstitution.roles.value[id].value = parsed.roles[id];
    }

    console.log(parsed, newInstitution);
    return newInstitution;
  };

  public walkPerson = (parsed: IMetaDataPerson, relatedEntityId: string) => {
    const newPerson = { ...basePerson(relatedEntityId) };
    newPerson._id.value = parsed._id;
    newPerson.name.value = parsed.name;
    newPerson.prename.value = parsed.prename;
    for (const id in parsed.institutions) {
      newPerson.institutions.value[id] = optionalArray();
      for (const institution of parsed.institutions[id]) {
        newPerson.institutions.value[id].value.push(
          this.walkInstitution(institution, relatedEntityId),
        );
      }
    }

    for (const id in parsed.roles) {
      newPerson.roles.value[id] = requiredArray();
      newPerson.roles.value[id].value = parsed.roles[id];
    }

    for (const id in parsed.contact_references) {
      if (
        !newPerson.contact_references ||
        !newPerson.contact_references.value
      ) {
        newPerson.contact_references = requiredObject();
      }
      newPerson.contact_references.value[id] = requiredObject();
      newPerson.contact_references.value[id].value = {
        ...baseContactReference(),
      };
      newPerson.contact_references.value[id].value.mail.value =
        parsed.contact_references[id].mail;
      newPerson.contact_references.value[id].value.note.value =
        parsed.contact_references[id].note;
      newPerson.contact_references.value[id].value.phonenumber.value =
        parsed.contact_references[id].phonenumber;
      newPerson.contact_references.value[id].value.creation_date.value =
        parsed.contact_references[id].creation_date;
    }
    // newPerson.contact_references;

    return newPerson;
  };

  // Walk simple object types e.g. address, link, id...
  public walkSimple = (parsed: any, func: () => any) => {
    const newSimple = { ...func() };
    for (const prop in parsed) {
      if (!parsed.hasOwnProperty(prop)) {
        continue;
      }

      const value = parsed[prop];
      const isArray = Array.isArray(value);
      const isSimple = typeof value === 'string' || typeof value === 'number';
      if (!isArray && isSimple) {
        newSimple[prop].value = value;
      } else if (isArray && !isSimple) {
        switch (prop) {
          case 'institution':
            // newSimple[prop].value = this.arrBase(baseInstitution, value);
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
      const isSimple = typeof value === 'string' || typeof value === 'number';
      if (!isArray && isSimple) {
        newBase[prop].value = value;
      } else if (isArray && !isSimple) {
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
            newBase[prop].value = new Array(len);
            for (let i = 0; i < len; i++) {
              newBase[prop].value[i] = this.walkPerson(
                valArr[i],
                jsonEntity._id,
              );
            }
            console.log('PersonArr', newBase[prop].value);
            break;
          case 'institutions':
            newBase[prop].value = new Array(len);
            for (let i = 0; i < len; i++) {
              newBase[prop].value[i] = this.walkInstitution(
                valArr[i],
                jsonEntity._id,
              );
            }
            console.log('InstArr', newBase[prop].value);
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
    let relatedEntityId = entity._id.value;
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
        const isSimple = typeof value === 'string' || typeof value === 'number';

        if (!isArray && isSimple) {
          resultObj[prop] = value;
        } else if (isArray && !isSimple) {
          const newArr = new Array((value as any[]).length);
          for (let i = 0; i < newArr.length; i++) {
            if (prop === 'phyObjs') {
              // Set relatedEntityId to the the id of physical entity
              relatedEntityId = value[i]._id.value;
            }
            newArr[i] = walk(value[i]);
          }
          resultObj[prop] = newArr;
        } else {
          if (!resultObj[prop]) {
            resultObj[prop] = {};
          }
          switch (prop) {
            case 'addresses':
            case 'notes':
            case 'contact_references':
              resultObj[prop][relatedEntityId] = walk(
                value[relatedEntityId].value,
              );
              break;
            case 'institutions':
              resultObj[prop][relatedEntityId] = (value[relatedEntityId]
                .value as any[]).map(walk);
              break;
            case 'roles':
              resultObj[prop][relatedEntityId] = value[relatedEntityId].value;
              break;
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
    return walk(entity);
  }
}
