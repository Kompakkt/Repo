import { Component, OnInit, Input } from '@angular/core';

import {baseAddress} from '../base-objects';

@Component({
  selector: 'app-address',
  templateUrl: './address.component.html',
  styleUrls: ['./address.component.scss'],
})
export class AddressComponent implements OnInit {

  @Input('address') public address: any;

  constructor() {
    this.address = {...baseAddress(), ...this.address};
  }

  ngOnInit() {
  }

}
