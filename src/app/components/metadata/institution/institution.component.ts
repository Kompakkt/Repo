import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';

import { baseInstitution } from '../base-objects';

@Component({
  selector: 'app-institution',
  templateUrl: './institution.component.html',
  styleUrls: ['./institution.component.scss'],
})
export class InstitutionComponent implements OnInit, OnChanges {

  @Input() public institution: any;

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

  ngOnChanges(changes: SimpleChanges) {
    if (changes.institution && changes.institution.currentValue !== undefined) {
      this.institution = changes.institution.currentValue;
      // Update roles
      for (const role of this.availableRoles) {
        role.checked = this.institution.role.value.includes(role.type);
      }
    }
  }

  public updateRoles = () =>
    this.institution.role.value = this.availableRoles
      .filter(role => role.checked)
      .map(role => role.type)

}
