import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { Address } from 'src/app/metadata';
import { TranslatePipe } from '../../../pipes/translate.pipe';

@Component({
  selector: 'app-address',
  templateUrl: './address.component.html',
  styleUrls: ['./address.component.scss'],
  standalone: true,
  imports: [MatFormField, MatLabel, MatInput, FormsModule, TranslatePipe],
})
export class AddressComponent {
  @Input('address')
  public address!: Address;

  @Input('required')
  public required = true;

  @Input('isPhysicalObject')
  public isPhysicalObject = false;
}
