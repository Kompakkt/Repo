import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { MongoHandlerService } from './mongo-handler.service';
import {
  IEntity,
  IMetaDataPerson,
  IMetaDataInstitution,
  IMetaDataTag,
  IMetaDataDigitalEntity,
  IMetaDataPhysicalEntity,
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
} from '../components/metadata/base-objects';

import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ContentProviderService {
  // Existing Server data
  private ServerPersons: IMetaDataPerson[] = [];
  private ServerInstitutions: IMetaDataInstitution[] = [];
  private ServerTags: IMetaDataTag[] = [];

  private PersonsSubject = new BehaviorSubject<IMetaDataPerson[]>([]);
  private InstitutionsSubject = new BehaviorSubject<IMetaDataInstitution[]>([]);
  public $Persons = this.PersonsSubject.asObservable();
  public $Institutions = this.InstitutionsSubject.asObservable();

  constructor(private mongo: MongoHandlerService) {
    this.updateContent();
  }

  public updateContent = async () => {
    // TODO: refetch on some occasions, e.g. after wizard completion
    await Promise.all([
      this.updatePersons(),
      this.updateInstitutions(),
      this.updateTags(),
    ]);
  };

  public updatePersons = async () => {
    this.mongo
      .getAllPersons()
      .then(result => {
        this.ServerPersons = result;
        if (Array.isArray(result)) {
          this.PersonsSubject.next(result);
        }
      })
      .catch(() => {});
  };

  public updateInstitutions = async () => {
    this.mongo
      .getAllInstitutions()
      .then(result => {
        this.ServerInstitutions = result;
        if (Array.isArray(result)) {
          this.InstitutionsSubject.next(result);
        }
      })
      .catch(() => {});
  };

  public updateTags = async () => {
    this.mongo
      .getAllTags()
      .then(result => (this.ServerTags = result))
      .catch(() => {});
  };

  public getTags = () => this.ServerTags;

  public walkEntity = (
    entity: IMetaDataDigitalEntity | IMetaDataPhysicalEntity,
    isPhysical = false,
  ) => {
    const newBase = baseEntity(entity);
    newBase.controls = {
      ...baseEntity(entity).controls,
      ...(isPhysical
        ? basePhysical(entity as IMetaDataPhysicalEntity)
        : baseDigital(entity as IMetaDataDigitalEntity)
      ).controls,
    };
    return newBase;
  };

  public convertValidationEntityToJSON(entity: FormGroup) {
    const result = entity.getRawValue();
    return result;
  }
}
