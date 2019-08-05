import {
  Component,
  OnInit,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';

import { basePerson, baseInstitution } from '../base-objects';

@Component({
  selector: 'app-person',
  templateUrl: './person.component.html',
  styleUrls: ['./person.component.scss'],
})
export class PersonComponent implements OnInit, OnChanges {
  @Input() public person: any;
  @Input() public relatedEntityId = '';

  public selectedContactRefId: string | undefined = this.relatedEntityId;

  public availableRoles = [
    { type: 'RIGHTS_OWNER', value: 'Rightsowner', checked: false },
    { type: 'CREATOR', value: 'Creator', checked: false },
    { type: 'EDITOR', value: 'Editor', checked: false },
    { type: 'DATA_CREATOR', value: 'Data Creator', checked: false },
    { type: 'CONTACT_PERSON', value: 'Contact Person', checked: false },
  ];

  constructor() {
    this.person = { ...basePerson(this.relatedEntityId), ...this.person };
  }

  ngOnInit() {
    if (this.relatedEntityId === '' || !this.relatedEntityId) {
      throw new Error('Person without relatedEntityId').stack;
    }
    this.selectedContactRefId = this.relatedEntityId;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.person && changes.person.currentValue !== undefined) {
      this.person = changes.person.currentValue;
      // Update roles
      this.selectedContactRefId = this.relatedEntityId;
      for (const role of this.availableRoles) {
        role.checked = this.person.roles.value[
          this.relatedEntityId
        ].value.includes(role.type);
      }
    }
  }

  // Dynamic label for mat-tabs
  public getTabLabel = (prop: any, type: string) => {
    return prop.value.length > 0 ? prop.value : `New ${type}`;
  };

  // Expose Object.keys() to NGX-HTML
  public getKeys = (obj: any) => Object.keys(obj);

  public debug = (obj: any) => console.log(obj);

  public addInstitution = () =>
    this.person.institutions.value[this.relatedEntityId].value.push({
      ...baseInstitution(this.relatedEntityId),
    });
  public removeInstitution = (index: number) =>
    this.person.institutions.value[this.relatedEntityId].value.splice(index, 1);

  public updateRoles = () =>
    (this.person.roles.value[
      this.relatedEntityId
    ].value = this.availableRoles
      .filter(role => role.checked)
      .map(role => role.type));
}
