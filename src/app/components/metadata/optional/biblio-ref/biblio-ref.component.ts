import { Component, Input } from '@angular/core';
import {
  FormControl,
  ReactiveFormsModule,
} from '@angular/forms';

import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

import { TranslatePipe } from '../../../../pipes/translate.pipe';
import { AnyEntity, DescriptionValueTuple} from 'src/app/metadata';

@Component({
  selector: 'app-biblio-ref',
  standalone: true,
  imports: [
    MatButton,
    MatFormField,
    MatInput,
    MatLabel,
    ReactiveFormsModule,
    TranslatePipe,
  ],
  templateUrl: './biblio-ref.component.html',
  styleUrl: './biblio-ref.component.scss'
})
export class BiblioRefComponent {
  @Input() entity!: AnyEntity;

  public urlControl = new FormControl('');
  public descriptionControl = new FormControl('');

  get isBiblioDataValid(): boolean {
    return this.descriptionControl.value !== '';
  }

  addNewBiblioData(): void {
    const biblioInstance = new DescriptionValueTuple({
      value: this.urlControl.value ?? '',
      description: this.descriptionControl.value ?? ''
    });

    if(this.isBiblioDataValid && DescriptionValueTuple.checkIsValid(biblioInstance)) {
      this.entity.biblioRefs.push(biblioInstance);
      this.resetFormFields();
    }
  }

  resetFormFields(): void {
    this.urlControl.setValue('');
    this.descriptionControl.setValue('');
  }
}
