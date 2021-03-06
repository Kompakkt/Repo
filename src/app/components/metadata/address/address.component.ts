import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Address } from '~metadata';

@Component({
  selector: 'app-address',
  templateUrl: './address.component.html',
  styleUrls: ['./address.component.scss'],
})
export class AddressComponent implements OnChanges {
  @Input('address')
  public address!: Address;

  @Input('required')
  public required = true;

  constructor() {}

  ngOnChanges(changes: SimpleChanges) {}
}
