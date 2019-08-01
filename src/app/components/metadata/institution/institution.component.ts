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
    this.institution = {...baseInstitution(), ...this.institution};
  }

  ngOnInit() {
  }

  public updateRoles = () =>
    this.institution.role.value = this.availableRoles
      .filter(role => role.checked)
      .map(role => role.type)

}
