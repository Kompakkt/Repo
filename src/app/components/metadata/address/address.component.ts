import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

import { baseAddress } from '../base-objects';

@Component({
  selector: 'app-address',
  templateUrl: './address.component.html',
  styleUrls: ['./address.component.scss'],
})
export class AddressComponent implements OnChanges {
  @Input() public address: FormGroup = baseAddress();
  @Input() public required = true;

  public isExistingAddress = false;

  constructor() {
    this.address.controls = {
      ...baseAddress().controls,
      ...this.address.controls,
    };
  }

  get building() {
    return this.address.get('building') as FormControl;
  }
  get number() {
    return this.address.get('number') as FormControl;
  }
  get street() {
    return this.address.get('street') as FormControl;
  }
  get postcode() {
    return this.address.get('postcode') as FormControl;
  }
  get city() {
    return this.address.get('city') as FormControl;
  }
  get country() {
    return this.address.get('country') as FormControl;
  }
  get creation_date() {
    return this.address.get('creation_date') as FormControl;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.address && changes.address.currentValue !== undefined) {
      this.address = changes.address.currentValue;
      this.isExistingAddress = this.country.value !== '';
    }
  }
}
