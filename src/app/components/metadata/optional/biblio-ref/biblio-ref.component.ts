import { Component, Input } from '@angular/core';
import {
  FormControl,
  ReactiveFormsModule,
} from '@angular/forms';

import { MatButton } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

import { SnackbarService } from 'src/app/services';
import { TranslatePipe } from '../../../../pipes/translate.pipe';
import { AnyEntity, DescriptionValueTuple} from 'src/app/metadata';

@Component({
  selector: 'app-biblio-ref',
  standalone: true,
  imports: [
    MatButton,
    MatDividerModule,
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

  public valueControl = new FormControl('');
  public descriptionControl = new FormControl('');

  constructor() {}

  get isBiblioDataValid(): boolean {
    return this.valueControl.value !== '' && this.descriptionControl.value !== '';
  }

  addNewBiblioData(): void {
    const biblioInstance = new DescriptionValueTuple({
      value: this.valueControl.value ?? '',
      description: this.descriptionControl.value ?? ''
    });

    if(this.isBiblioDataValid && DescriptionValueTuple.checkIsValid(biblioInstance)) {
      this.entity.biblioRefs.push(biblioInstance);
      this.resetFormFields();
    }
  }

  resetFormFields(): void {
    this.valueControl.setValue('');
    this.descriptionControl.setValue('');
  }
}
