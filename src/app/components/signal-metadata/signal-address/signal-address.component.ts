import { Component, input } from '@angular/core';
import { IDigitalEntityForm } from '../base-signal-child-component';

@Component({
  selector: 'app-signal-address',
  imports: [],
  templateUrl: './signal-address.component.html',
  styleUrl: './signal-address.component.scss',
})
export class SignalAddressComponent {
  entityForm = input.required<IDigitalEntityForm>();
}
