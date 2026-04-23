import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Address } from 'src/app/metadata';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { OutlinedInputComponent } from '../../outlined-input/outlined-input.component';

@Component({
  selector: 'app-address',
  templateUrl: './address.component.html',
  styleUrls: ['./address.component.scss'],
  imports: [FormsModule, TranslatePipe, OutlinedInputComponent],
})
export class AddressComponent {
  @Input('address')
  public address!: Address;

  @Input('required')
  public required = true;

  @Input('isPhysicalObject')
  public isPhysicalObject = false;
}
