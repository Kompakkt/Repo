import {
  Component,
  OnInit,
  Input,
  Output,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import {
  MatRadioChange,
  MatAutocompleteSelectedEvent,
} from '@angular/material';

import {
  baseExternalId,
  baseExternalLink,
  baseDimension,
  baseCreation,
  baseInstitution,
  basePerson,
  baseEntity,
  baseDigital,
  basePhysical,
  baseTag,
} from '../base-objects';
import { ContentProviderService } from '../../../services/content-provider.service';

@Component({
  selector: 'app-entity',
  templateUrl: './entity.component.html',
  styleUrls: ['./entity.component.scss'],
})
export class EntityComponent implements OnInit, OnChanges {
  // Determine whether this entity is digital or physical
  @Input() isPhysical = false;

  // Instance of this entity
  @Input() entity: any = {
    ...baseEntity(),
    ...(this.isPhysical ? basePhysical() : baseDigital()),
  };

  public availableLicences = ['BY', 'BYSA', 'BYNC', 'BYNCSA', 'BYND', 'BYNCND'];
  public selectedLicence = '';

  constructor(private content: ContentProviderService) {}

  // Typeahead combined out of server data & local data
  public getPersonsTypeahead = () =>
    this.entity.persons.value.concat(this.content.getPersons());

  public getInstitutionsTypeahead = () =>
    this.entity.institutions.value.concat(this.content.getInstitutions());

  public getTagsTypeahead = () =>
    this.entity.tags.value.concat(this.content.getTags());

  public personSelected = (event: MatAutocompleteSelectedEvent) => {
    const newPerson = event.option.value;
    this.entity.persons.value.push(
      typeof newPerson.name === 'string'
        ? this.content.walkSimple(newPerson, basePerson)
        : newPerson,
    );
  };

  public institutionSelected = (event: MatAutocompleteSelectedEvent) => {
    const newInstitution = event.option.value;
    this.entity.institutions.value.push(
      typeof newInstitution.name === 'string'
        ? this.content.walkSimple(newInstitution, baseInstitution)
        : newInstitution,
    );
  };

  public tagSelected = (event: MatAutocompleteSelectedEvent) => {
    const newTag = event.option.value;
    this.entity.tags.value.push(
      typeof newTag.value === 'string'
        ? this.content.walkSimple(newTag, baseTag)
        : newTag,
    );
  };

  // Dynamic label for mat-tabs
  public getTabLabel = (prop: any, type: string) => {
    return prop.value.length > 0 ? prop.value : `New ${type}`;
  };

  public updateLicence = (event: MatRadioChange) =>
    (this.entity.licence.value = event.value);

  // Handle externalId
  public addExternalId = () =>
    this.entity.externalId.value.push({ ...baseExternalId() });

  public removeExternalId = (index: number) =>
    this.entity.externalId.value.splice(index, 1);

  // Handle externalLink
  public addExternalLink = () =>
    this.entity.externalLink.value.push({ ...baseExternalLink() });

  public removeExternalLink = (index: number) =>
    this.entity.externalLink.value.splice(index, 1);

  // Handle persons
  public addPerson = () => this.entity.persons.value.push({ ...basePerson() });

  public removePerson = (index: number) =>
    this.entity.persons.value.splice(index, 1);

  // Handle institutions
  public addInstitution = () =>
    this.entity.institutions.value.push({ ...baseInstitution() });

  public removeInstitution = (index: number) =>
    this.entity.institutions.value.splice(index, 1);

  // Handle physical entities
  public addPhysicalEntity = () =>
    this.entity.phyObjs.value.push({ ...baseEntity(), ...basePhysical() });

  public removePhysicalEntity = (index: number) =>
    this.entity.phyObjs.value.splice(index, 1);

  // Handle discipline input
  public addDiscipline = (event: KeyboardEvent) => {
    if (event.keyCode === 13 || event.key === 'Enter') {
      this.entity.discipline.value.push(
        (event.target as HTMLInputElement).value,
      );
      (event.target as HTMLInputElement).value = '';
    }
  };

  public removeDiscipline = (index: number) =>
    this.entity.discipline.value.splice(index, 1);

  // Handle tag input
  public addTag = (event: KeyboardEvent) => {
    if (event.keyCode === 13 || event.key === 'Enter') {
      const newTag = { ...baseTag() };
      newTag.value.value = (event.target as HTMLInputElement).value;
      this.entity.tags.value.push(newTag);
      (event.target as HTMLInputElement).value = '';
    }
  };

  public removeTag = (index: number) => this.entity.tags.value.splice(index, 1);

  // Handle dimensions
  public addDimension = () =>
    this.entity.dimensions.value.push({ ...baseDimension() });

  public removeDimension = (index: number) =>
    this.entity.dimensions.value.splice(index, 1);

  // Handle creation
  public addCreation = () =>
    this.entity.creation.value.push({ ...baseCreation() });

  public removeCreation = (index: number) =>
    this.entity.creation.value.splice(index, 1);

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges) {
    // Update entity from parent
    // Used when overwriting
    if (changes.entity) {
      if (changes.entity.currentValue !== undefined) {
        this.entity = changes.entity.currentValue;

        // On digital entities, overwrite the licence
        if (this.entity.licence && this.entity.licence.value !== '') {
          this.selectedLicence = this.entity.licence.value;
        }
      }
    }
  }
}
