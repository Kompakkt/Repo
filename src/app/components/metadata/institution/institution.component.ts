import { Component, OnInit, Input } from '@angular/core';

import { baseInstitution } from '../base-objects';

@Component({
  selector: 'app-institution',
  templateUrl: './institution.component.html',
  styleUrls: ['./institution.component.scss'],
})
export class InstitutionComponent implements OnInit {

  @Input('institution') public institution: any;

  public availableRoles = [
    { type: 'RIGHTS_OWNER', value: 'Rightsowner', checked: false },
    { type: 'CREATOR', value: 'Creator', checked: false },
    { type: 'EDITOR', value: 'Editor', checked: false },
    { type: 'DATA_CREATOR', value: 'Data Creator', checked: false },
    { type: 'CONTACT_PERSON', value: 'Contact Person', checked: false },
  ];

  constructor() {
    // Override base institution with input intitution
    // but keep role array empty, as we want new roles
    // for this entity
    this.institution = {...baseInstitution(), ...this.institution, role: []};
  }

  ngOnInit() {
  }

  public updateRoles = () =>
    this.institution.role = this.availableRoles
      .filter(role => role.checked)
      .map(role => role.type)

}
