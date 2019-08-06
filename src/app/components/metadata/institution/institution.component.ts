import {
  Component,
  OnInit,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';

import { baseInstitution } from '../base-objects';

@Component({
  selector: 'app-institution',
  templateUrl: './institution.component.html',
  styleUrls: ['./institution.component.scss'],
})
export class InstitutionComponent implements OnInit, OnChanges {
  @Input() public institution: any;
  @Input() public relatedEntityId = '';

  public selectedAddressId: string | undefined = this.relatedEntityId;

  public isExistingInstitution = false;

  public availableRoles = [
    { type: 'RIGHTS_OWNER', value: 'Rightsowner', checked: false },
    { type: 'CREATOR', value: 'Creator', checked: false },
    { type: 'EDITOR', value: 'Editor', checked: false },
    { type: 'DATA_CREATOR', value: 'Data Creator', checked: false },
    { type: 'CONTACT_PERSON', value: 'Contact Person', checked: false },
  ];

  constructor() {
    this.institution = {
      ...baseInstitution(this.relatedEntityId),
      ...this.institution,
    };
  }

  // Expose Object.keys() to NGX-HTML
  public getKeys = (obj: any) => Object.keys(obj);

  public getDateString = (date: number) => new Date(date).toDateString();

  ngOnInit() {
    if (this.relatedEntityId === '') {
      throw new Error('Institution without relatedEntityId').stack;
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.institution && changes.institution.currentValue !== undefined) {
      this.institution = changes.institution.currentValue;

      this.isExistingInstitution = this.institution.name.value !== '';

      // Find latest non-empty contact address
      const addresses = this.institution.addresses.value;
      let latestAddress;
      let latestId;
      for (const id in addresses) {
        const isEmpty = addresses[id].value.country.value === '';
        if (isEmpty) continue;
        const date = addresses[id].value.creation_date.value;
        if (!latestAddress || date > latestAddress.value.creation_date.value) {
          latestAddress = addresses[id];
          latestId = id;
        }
      }

      this.selectedAddressId = latestId ? latestId : this.relatedEntityId;

      // Update roles
      for (const role of this.availableRoles) {
        role.checked = this.institution.roles.value[
          this.relatedEntityId
        ].value.includes(role.type);
      }
    }
  }

  public updateRoles = () => {
    this.institution.roles.value[
      this.relatedEntityId
    ].value = this.availableRoles
      .filter(role => role.checked)
      .map(role => role.type);
  };
}
