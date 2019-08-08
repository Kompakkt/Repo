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
import { ObjectIdService } from '../../../services/object-id.service';

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

  public availableLicences = [{
    title: 'BY',
    description: 'CC Attribution',
    link: 'https://creativecommons.org/licenses/by/4.0',
  }, {
    title: 'BY-SA',
    description: 'CC Attribution-ShareAlike',
    link: 'https://creativecommons.org/licenses/by-sa/4.0',
  }, {
    title: 'BY-ND',
    description: 'CC Attribution-NoDerivatives',
    link: 'https://creativecommons.org/licenses/by-nd/4.0',
  }, {
    title: 'BYNC',
    description: 'CC Attribution-NonCommercial',
    link: 'https://creativecommons.org/licenses/by-nc/4.0',
  }, {
    title: 'BYNCSA',
    description: 'CC Attribution-NonCommercial-ShareAlike',
    link: 'https://creativecommons.org/licenses/by-nc-sa/4.0',
  }, {
    title: 'BYNCND',
    description: 'CC Attribution-NonCommercial-NoDerivatives',
    link: 'https://creativecommons.org/licenses/by-nc-nd/4.0',
  }];
  public selectedLicence = '';

  constructor(
    private content: ContentProviderService,
    private objectId: ObjectIdService,
  ) {}

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
        ? this.content.walkPerson(newPerson, this.entity._id.value)
        : newPerson,
    );
  };

  public institutionSelected = (event: MatAutocompleteSelectedEvent) => {
    const newInstitution = event.option.value;
    this.entity.institutions.value.push(
      typeof newInstitution.name === 'string'
        ? this.content.walkInstitution(newInstitution, this.entity._id.value)
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
  public addPerson = () => {
    const newPerson = { ...basePerson(this.entity._id.value) };
    newPerson._id.value = this.objectId.generateEntityId();
    this.entity.persons.value.push(newPerson);
  };

  public removePerson = (index: number) => {
    this.entity.persons.value.splice(index, 1);
  };

  // Handle institutions
  public addInstitution = () => {
    const newInstitution = { ...baseInstitution(this.entity._id.value) };
    newInstitution._id.value = this.objectId.generateEntityId();
    this.entity.institutions.value.push(newInstitution);
  };

  public removeInstitution = (index: number) => {
    this.entity.institutions.value.splice(index, 1);
  };

  // Handle physical entities
  public addPhysicalEntity = () => {
    const newPhyEnt = { ...baseEntity(), ...basePhysical() };
    newPhyEnt._id.value = this.objectId.generateEntityId();
    this.entity.phyObjs.value.push(newPhyEnt);
  };

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
      newTag._id.value = this.objectId.generateEntityId();
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

  ngOnInit() {
    if (this.entity._id.value === '') {
      this.entity._id.value = this.objectId.generateEntityId();
    }
  }

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
