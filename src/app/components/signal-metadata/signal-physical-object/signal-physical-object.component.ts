import { Component, input } from '@angular/core';
import { IDigitalEntityForm } from '../base-signal-child-component';

@Component({
  selector: 'app-signal-physical-object',
  imports: [],
  templateUrl: './signal-physical-object.component.html',
  styleUrl: './signal-physical-object.component.scss',
})
export class SignalPhysicalObjectComponent {
  entityForm = input.required<IDigitalEntityForm>();
}
