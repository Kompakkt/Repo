import { Component, OnInit, Input } from '@angular/core';

import { basePerson } from '../base-objects';

@Component({
  selector: 'app-person',
  templateUrl: './person.component.html',
  styleUrls: ['./person.component.scss'],
})
export class PersonComponent implements OnInit {

  @Input('person') public person: any;

  public availableRoles = [
    { type: 'RIGHTS_OWNER', value: 'Rightsowner', checked: false },
    { type: 'CREATOR', value: 'Creator', checked: false },
    { type: 'EDITOR', value: 'Editor', checked: false },
    { type: 'DATA_CREATOR', value: 'Data Creator', checked: false },
    { type: 'CONTACT_PERSON', value: 'Contact Person', checked: false },
  ];

  constructor() {
    // Override base person with input person
    // but keep role array empty, as we want new roles
    // for this entity
    this.person = {...basePerson(), ...this.person, role: []};
  }

  ngOnInit() {
  }

  public updateRoles = () =>
    this.person.role = this.availableRoles
      .filter(role => role.checked)
      .map(role => role.type)
}
