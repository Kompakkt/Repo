import { Component, Input } from '@angular/core';
import { Address } from '~metadata';
import { TranslateService } from '../../../services/translate.service';

@Component({
  selector: 'app-address',
  templateUrl: './address.component.html',
  styleUrls: ['./address.component.scss'],
})
export class AddressComponent {
  @Input('address')
  public address!: Address;

  @Input('required')
  public required = true;
}
