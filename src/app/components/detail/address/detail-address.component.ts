import { Component, Input } from '@angular/core';

import { IAddress } from 'src/common';

@Component({
  selector: 'app-detail-address',
  templateUrl: './detail-address.component.html',
  styleUrls: ['./detail-address.component.scss'],
})
export class DetailAddressComponent {
  @Input('address')
  public address?: IAddress;

  get country() {
    return this.address?.country ?? 'N/A';
  }

  get city() {
    return [this.address?.postcode, this.address?.city].join('  ') ?? 'N/A';
  }

  get street() {
    return [this.address?.street, this.address?.number].join('  ') ?? 'N/A';
  }

  get building() {
    return this.address?.building ?? 'N/A';
  }
}
