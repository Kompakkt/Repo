import { Component, OnInit, Input } from '@angular/core';

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
  }

  // Handle externalId
  public addExternalId = () =>
    this.entity.externalId.push({ type: '', value: '' })

  public removeExternalId = (index: number) =>
    this.entity.externalId.splice(index, 1)

  // Handle externalLink
  public addExternalLink = () =>
    this.entity.externalLink.push({ description: '', value: '' })

  public removeExternalLink = (index: number) =>
    this.entity.externalLink.splice(index, 1)

  // Handle persons
  public addPerson = () =>
    this.entity.persons.push({ ...basePerson() })

  public removePerson = (index: number) =>
    this.entity.persons.splice(index, 1)

  // Handle institutions
  public addInstitution = () =>
    this.entity.institutions.push({ ...baseInstitution() })

  public removeInstitution = (index: number) =>
    this.entity.institutions.splice(index, 1)

  // Handle physical entities
  public addPhysicalEntity = () =>
    this.entity.phyObjs.push({ ...baseEntity(), ...basePhysical() })

  public removePhysicalEntity = (index: number) =>
    this.entity.phyObjs.splice(index, 1)

  // Handle discipline input
  public addDiscipline = (event: KeyboardEvent) => {
    if (event.keyCode === 13 || event.key === 'Enter') {
      this.entity.discipline
        .push((event.target as HTMLInputElement).value);
      (event.target as HTMLInputElement).value = '';
    }
  }

  public removeDiscipline = (index: number) =>
    this.entity.discipline.splice(index, 1)

  // Handle tag input
  public addTag = (event: KeyboardEvent) => {
    if (event.keyCode === 13 || event.key === 'Enter') {
      this.entity.tags
        .push((event.target as HTMLInputElement).value);
      (event.target as HTMLInputElement).value = '';
    }
  }

  public removeTag = (index: number) =>
    this.entity.tags.splice(index, 1)

  // Handle dimensions
  public addDimension = () =>
    this.entity.dimensions.push({...baseDimension()})

  public removeDimension = (index: number) =>
    this.entity.dimensions.splice(index, 1)

  // Handle creation
  public addCreation = () =>
    this.entity.creation.push({...baseCreation()})

  public removeCreation = (index: number) =>
    this.entity.creation.splice(index, 1)

  ngOnInit() {
  }

}
