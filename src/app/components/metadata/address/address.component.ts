import {
  Component,
  OnInit,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';

import { baseAddress } from '../base-objects';

@Component({
  selector: 'app-address',
  templateUrl: './address.component.html',
  styleUrls: ['./address.component.scss'],
})
export class AddressComponent implements OnInit, OnChanges {
  @Input() public address: any;

  public isExistingAddress = false;

  constructor() {
    this.address = { ...baseAddress(), ...this.address };
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.address && changes.address.currentValue !== undefined) {
      this.address = changes.address.currentValue;
      this.isExistingAddress = this.address.country.value !== '';
    }
  }

  ngOnInit() {}
}
