import { Component, model, effect } from '@angular/core';
import { Address, cloneEntity, PhysicalEntity } from 'src/app/metadata';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { OutlinedInputComponent } from '../../outlined-input/outlined-input.component';
import { form, FormField, required } from '@angular/forms/signals';

@Component({
  selector: 'app-address',
  templateUrl: './address.component.html',
  styleUrls: ['./address.component.scss'],
  imports: [FormField, TranslatePipe, OutlinedInputComponent],
})
export class AddressComponent {
  entity = model.required<PhysicalEntity>();
  addressModel = model({
    building: '',
    number: '',
    street: '',
    postcode: '',
    city: '',
    country: '',
  });
  addressForm = form(this.addressModel, path => {
    required(path.street);
    required(path.postcode);
    required(path.city);
    required(path.country);
  });

  _addressFormChangedEffectRef = effect(() => {
    const data = this.addressForm().value();
    this.entity.update(entity => {
      const clone = cloneEntity(entity) as PhysicalEntity;
      clone.place.address = new Address({ ...data });
      return clone;
    });
  });

  _entityChangedEffectRef = effect(() => {
    const entity = this.entity();
    const data = this.addressForm().value();
    const keys = Object.keys(this.addressModel());
    if (keys.every(key => entity.place.address[key] === data[key])) return;
    this.entity.update(entity => {
      const clone = cloneEntity(entity) as PhysicalEntity;
      clone.place.address = new Address({ ...data });
      return clone;
    });
  });
}
