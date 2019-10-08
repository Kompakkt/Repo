import {
  Component,
  OnInit,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { MatSelectChange } from '@angular/material';
import { FormArray, FormControl, FormGroup } from '@angular/forms';

import { baseInstitution } from '../base-objects';
import { getMapping, setMapping } from '../../../services/selected-id.service';

@Component({
  selector: 'app-institution',
  templateUrl: './institution.component.html',
  styleUrls: ['./institution.component.scss'],
})
export class InstitutionComponent implements OnInit, OnChanges {
  @Input() public relatedEntityId = '';
  @Input() public institution: FormGroup = baseInstitution(
    this.relatedEntityId,
  );

  public isExistingInstitution = false;

  public availableRoles = [
    { type: 'RIGHTS_OWNER', value: 'Rightsowner', checked: false },
    { type: 'CREATOR', value: 'Creator', checked: false },
    { type: 'EDITOR', value: 'Editor', checked: false },
    { type: 'DATA_CREATOR', value: 'Data Creator', checked: false },
    { type: 'CONTACT_PERSON', value: 'Contact Person', checked: false },
  ];

  constructor() {
    this.institution.controls = {
      ...baseInstitution(this.relatedEntityId).controls,
      ...this.institution.controls,
    };
  }

  // Expose Object.keys() to NGX-HTML
  public getKeys = (obj: any) => Object.keys(obj);

  public getDateString = (date: number) => new Date(date).toDateString();

  // Getters
  get _id() {
    return this.institution.get('_id') as FormControl;
  }
  get name() {
    return this.institution.get('name') as FormControl;
  }
  get university() {
    return this.institution.get('university') as FormControl;
  }
  get addresses() {
    return this.institution.get('addresses') as FormGroup;
  }
  get roles() {
    return this.institution.get('roles') as FormGroup;
  }
  get notes() {
    return this.institution.get('notes') as FormGroup;
  }
  get relatedNotes() {
    return (this.institution.get('notes') as FormGroup).controls[
      this.relatedEntityId
    ] as FormControl;
  }

  ngOnInit() {
    if (this.relatedEntityId === '') {
      throw new Error('Institution without relatedEntityId').stack;
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.institution && changes.institution.currentValue !== undefined) {
      this.institution = changes.institution.currentValue;

      this.isExistingInstitution = this.name.value !== '';

      // Find latest non-empty contact address
      const addresses = this.addresses.getRawValue();
      let latestAddress;
      let latestId;
      for (const id in addresses) {
        const isEmpty = addresses[id].country.length === 0;
        if (isEmpty) continue;
        const date = addresses[id].creation_date;
        if (!latestAddress || date > latestAddress.creation_date.value) {
          latestAddress = addresses[id];
          latestId = id;
        }
      }

      setMapping(
        this._id.value,
        'addresses',
        latestId ? latestId : this.relatedEntityId,
      );

      // Update roles
      for (const role of this.availableRoles) {
        role.checked = this.roles
          .getRawValue()
          [this.relatedEntityId].includes(role.type);
      }

      this.reevaluateAddresses();
      this.roles.updateValueAndValidity();
    }
  }

  public updateRoles = () => {
    (this.roles.controls[this.relatedEntityId] as FormArray).clear();

    this.availableRoles
      .filter(role => role.checked)
      .map(role => new FormControl(role.type))
      .forEach(control =>
        (this.roles.controls[this.relatedEntityId] as FormArray).push(control),
      );

    this.roles.updateValueAndValidity();
  };

  public reevaluateAddresses() {
    Object.entries(this.addresses.controls).forEach(entry => {
      if (entry[0] === this.selected_address) {
        entry[1].enable();
      } else {
        entry[1].disable();
      }
      entry[1].updateValueAndValidity();
    });

    this.addresses.updateValueAndValidity();
    this.institution.updateValueAndValidity();
  }

  get selected_address() {
    return getMapping(this._id.value, 'addresses') || this.relatedEntityId;
  }

  public selectAddress(event: MatSelectChange) {
    setMapping(this._id.value, 'addresses', event.value);
    this.reevaluateAddresses();
  }
}
