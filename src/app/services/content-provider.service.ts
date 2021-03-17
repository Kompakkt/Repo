import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { BackendService } from './backend.service';
import {
  IMetaDataPerson,
  IMetaDataInstitution,
  IMetaDataTag,
  IMetaDataDigitalEntity,
  IMetaDataPhysicalEntity,
} from '~interfaces';
import { baseEntity, baseDigital, basePhysical } from '../components/metadata/base-objects';

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

  constructor(private backend: BackendService) {
    this.updateContent();
  }

  public updateContent = async () => {
    // TODO: refetch on some occasions, e.g. after wizard completion
    await Promise.all([this.updatePersons(), this.updateInstitutions(), this.updateTags()]);
  };

  public updatePersons = async () => {
    this.backend
      .getAllPersons()
      .then(result => {
        if (Array.isArray(result)) {
          this.ServerPersons = result;
          this.PersonsSubject.next(this.ServerPersons);
        }
      })
      .catch(() => {});
  };

  public updateInstitutions = async () => {
    this.backend
      .getAllInstitutions()
      .then(result => {
        if (Array.isArray(result)) {
          this.ServerInstitutions = result;
          this.InstitutionsSubject.next(this.ServerInstitutions);
        }
      })
      .catch(() => {});
  };

  public updateTags = async () => {
    this.backend
      .getAllTags()
      .then(result => {
        const uniqueTags = new Array<IMetaDataTag>();
        const map = new Map();
        for (const tag of result) {
          if (!map.has(tag.value)) {
            map.set(tag.value, true);
            uniqueTags.push({
              _id: tag._id,
              value: tag.value,
            });
          }
        }
        this.ServerTags = uniqueTags.sort((a, b) => (a.value > b.value ? 1 : -1));
      })
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
