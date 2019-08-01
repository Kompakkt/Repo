import { Component, OnInit, Input, Output } from '@angular/core';

import { baseDimension, baseCreation, baseInstitution, basePerson, baseEntity, baseDigital, basePhysical } from '../base-objects';

@Component({
  selector: 'app-entity',
  templateUrl: './entity.component.html',
  styleUrls: ['./entity.component.scss'],
})
export class EntityComponent implements OnInit {
  // Determine whether this entity is digital or physical
  @Input() isPhysical = false;

  // Instance of this entity
  @Input() entity: any;

  public availableLicences = [
    'BY', 'BYSA', 'BYNC',
    'BYNCSA', 'BYND', 'BYNCND',
  ];
  public selectedLicence = 'BY';

  constructor() {
    this.entity = {
      ...baseEntity(),
      ...((this.isPhysical) ? basePhysical() : baseDigital()),
      ...this.entity,
    };
    console.log('Created new entity:', this.entity);
  }

  // Handle externalId
  public addExternalId = () =>
    this.entity.externalId.value.push({ type: '', value: '' })

  public removeExternalId = (index: number) =>
    this.entity.externalId.value.splice(index, 1)

  // Handle externalLink
  public addExternalLink = () =>
    this.entity.externalLink.value.push({ description: '', value: '' })

  public removeExternalLink = (index: number) =>
    this.entity.externalLink.value.splice(index, 1)

  // Handle persons
  public addPerson = () =>
    this.entity.persons.value.push({ ...basePerson() })

  public removePerson = (index: number) =>
    this.entity.persons.value.splice(index, 1)

  // Handle institutions
  public addInstitution = () =>
    this.entity.institutions.value.push({ ...baseInstitution() })

  public removeInstitution = (index: number) =>
    this.entity.institutions.value.splice(index, 1)

  // Handle physical entities
  public addPhysicalEntity = () =>
    this.entity.phyObjs.value.push({ ...baseEntity(), ...basePhysical() })

  public removePhysicalEntity = (index: number) =>
    this.entity.phyObjs.value.splice(index, 1)

  // Handle discipline input
  public addDiscipline = (event: KeyboardEvent) => {
    if (event.keyCode === 13 || event.key === 'Enter') {
      this.entity.discipline.value
        .push((event.target as HTMLInputElement).value);
      (event.target as HTMLInputElement).value = '';
    }
  }

  public removeDiscipline = (index: number) =>
    this.entity.discipline.value.splice(index, 1)

  // Handle tag input
  public addTag = (event: KeyboardEvent) => {
    if (event.keyCode === 13 || event.key === 'Enter') {
      this.entity.tags.value
        .push((event.target as HTMLInputElement).value);
      (event.target as HTMLInputElement).value = '';
    }
  }

  public removeTag = (index: number) =>
    this.entity.tags.value.splice(index, 1)

  // Handle dimensions
  public addDimension = () =>
    this.entity.dimensions.value.push({...baseDimension()})

  public removeDimension = (index: number) =>
    this.entity.dimensions.value.splice(index, 1)

  // Handle creation
  public addCreation = () =>
    this.entity.creation.value.push({...baseCreation()})

  public removeCreation = (index: number) =>
    this.entity.creation.value.splice(index, 1)

  ngOnInit() {
  }

}
