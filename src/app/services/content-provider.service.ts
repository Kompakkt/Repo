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

@Injectable({
  providedIn: 'root',
})
export class ContentProviderService {
  // Existing Server data
  private ServerPersons: IMetaDataPerson[] = [];
  private ServerInstitutions: IMetaDataInstitution[] = [];
  private ServerTags: IMetaDataTag[] = [];

  // When adding a new person/institution:
  // keep a reference to the FormGroup in here
  // this way we can add and use the same FormGroup instance
  // multiple times
  private ReferencePersons: FormGroup[] = [];
  private ReferencePersonsAsValues: IMetaDataPerson[] = [];
  private ReferenceInstitutions: FormGroup[] = [];
  private ReferenceInstitutionsAsValues: IMetaDataInstitution[] = [];

  constructor(private mongo: MongoHandlerService) {
    this.updateContent();
  }

  public updateContent = async () => {
    // TODO: refetch on some occasions, e.g. after wizard completion
    await Promise.all([
      this.mongo
        .getAllPersons()
        .then(result => (this.ServerPersons = result))
        .catch(() => {}),

      this.mongo
        .getAllInstitutions()
        .then(result => (this.ServerInstitutions = result))
        .catch(() => {}),

      this.mongo
        .getAllTags()
        .then(result => (this.ServerTags = result))
        .catch(() => {}),
    ]);
  };

  // TODO: Get references working
  /*public getPersons = () =>
    this.ServerPersons.concat(this.ReferencePersonsAsValues);
  public getInstitutions = () =>
    this.ServerInstitutions.concat(this.ReferenceInstitutionsAsValues);*/
  public getPersons = () => this.ServerPersons;
  public getInstitutions = () => this.ServerInstitutions;
  public getTags = () => this.ServerTags;

  public addReferencePerson = (person: FormGroup) =>
    this.ReferencePersons.push(person);
  public addReferenceInstitution = (institution: FormGroup) =>
    this.ReferenceInstitutions.push(institution);

  // Trigger this manually when requiring new Typeahead information
  // If we would trigger on FormGroup valueChanges this would trigger
  // permanently
  public trigger = () => {
    // this.updatePersons();
    // this.updateInstitutions();
  };

  private updatePersons = () =>
    (this.ReferencePersonsAsValues = this.ReferencePersons.map(_p => _p.value));

  private updateInstitutions = () =>
    (this.ReferenceInstitutionsAsValues = this.ReferenceInstitutions.map(
      _i => _i.value,
    ));

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
