import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';

import { basePerson, baseInstitution } from '../base-objects';

@Component({
  selector: 'app-person',
  templateUrl: './person.component.html',
  styleUrls: ['./person.component.scss'],
})
export class PersonComponent implements OnInit, OnChanges {

  @Input() public person: any;

  public availableRoles = [
    { type: 'RIGHTS_OWNER', value: 'Rightsowner', checked: false },
    { type: 'CREATOR', value: 'Creator', checked: false },
    { type: 'EDITOR', value: 'Editor', checked: false },
    { type: 'DATA_CREATOR', value: 'Data Creator', checked: false },
    { type: 'CONTACT_PERSON', value: 'Contact Person', checked: false },
  ];

  constructor() {
    this.person = {...basePerson(), ...this.person};
  }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.person && changes.person.currentValue !== undefined) {
      this.person = changes.person.currentValue;
      // Update roles
      for (const role of this.availableRoles) {
        role.checked = this.person.role.value.includes(role.type);
      }
    }
  }

  public addInstitution = () =>
    this.person.institution.value.push({...baseInstitution()})

  public updateRoles = () =>
    this.person.role.value = this.availableRoles
      .filter(role => role.checked)
      .map(role => role.type)
}
