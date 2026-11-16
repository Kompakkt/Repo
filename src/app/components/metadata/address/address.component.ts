import { Component, model, effect } from '@angular/core';
import { NgxFluentPipe } from '@apappas1129/ngx-fluent';
import { OutlinedInputComponent } from '../../outlined-input/outlined-input.component';
import { form, FormField, required } from '@angular/forms/signals';
import { emptyAddress } from 'src/app/metadata';
import { IPhysicalEntityResolved } from '@kompakkt/common';

@Component({
  selector: 'app-address',
  templateUrl: './address.component.html',
  styleUrls: ['./address.component.scss'],
  imports: [FormField, NgxFluentPipe, OutlinedInputComponent],
})
export class AddressComponent {
  entity = model.required<IPhysicalEntityResolved>();
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
      const clone = structuredClone(entity);
      clone.place.address = { ...emptyAddress(), ...data };
      return clone;
    });
  });

  _entityChangedEffectRef = effect(() => {
    const entity = this.entity();
    const data = this.addressForm().value();
    const keys = Object.keys(this.addressModel());
    if (keys.every(key => entity.place.address[key] === data[key])) return;
    this.entity.update(entity => {
      const clone = structuredClone(entity);
      clone.place.address = { ...emptyAddress(), ...data };
      return clone;
    });
  });
}
