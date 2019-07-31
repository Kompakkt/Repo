import { Component, OnInit, Input } from '@angular/core';

import { baseInstitution, basePerson, baseEntity, baseDigital, basePhysical } from '../base-objects';

@Component({
  selector: 'app-entity',
  templateUrl: './entity.component.html',
  styleUrls: ['./entity.component.scss'],
})
export class EntityComponent implements OnInit {
  // Determine whether this entity is digital or physical
  @Input('physical') public isPhysical = false;
  public isDigital = !this.isPhysical;

  // Allow input of already existing entity
  @Input('override') private override: any = {};

  // Instance of this entity
  public entity = {
    ...baseEntity,
    ...((this.isDigital) ? baseDigital : basePhysical),
    // If we have an existing entity, override values
    ...this.override,
  };

  constructor() {
    console.log('Entity isDigital:', this.isDigital, this);
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
    this.entity.persons.push({...basePerson})

  public removePerson = (index: number) =>
    this.entity.persons.splice(index, 1)

  // Handle institutions
  public addInstitution = () =>
    this.entity.institutions.push({...baseInstitution})

  public removeInstitution = (index: number) =>
    this.entity.institutions.splice(index, 1)

  ngOnInit() {
  }

}
