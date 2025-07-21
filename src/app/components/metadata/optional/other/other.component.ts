import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { MatButton } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

import { TranslatePipe } from '../../../../pipes/translate.pipe';
import { AnyEntity, DescriptionValueTuple } from 'src/app/metadata';
import { OptionalCardListComponent } from '../optional-card-list/optional-card-list.component';

@Component({
  selector: 'app-other',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButton,
    MatDividerModule,
    MatFormField,
    MatLabel,
    MatInput,
    TranslatePipe,
    OptionalCardListComponent,
  ],
  templateUrl: './other.component.html',
  styleUrl: './other.component.scss',
})
export class OtherComponent {
  @Input() entity!: AnyEntity;

  public valueControl = new FormControl('');
  public descriptionControl = new FormControl('');

  get isOtherDataValid(): boolean {
    return this.valueControl.value !== '' && this.descriptionControl.value !== '';
  }

  addNewOtherData(): void {
    const otherInstance = new DescriptionValueTuple({
      value: this.valueControl.value ?? '',
      description: this.descriptionControl.value ?? '',
    });

    if (this.isOtherDataValid && DescriptionValueTuple.checkIsValid(otherInstance)) {
      console.log(this.entity);
      this.entity.other.push(otherInstance);
      this.resetFormFields();
    }
  }

  resetFormFields(): void {
    this.valueControl.setValue('');
    this.descriptionControl.setValue('');
  }
}
