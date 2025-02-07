import { Component, Input } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';

import { MatButton } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

import { TranslatePipe } from '../../../../pipes/translate.pipe';
import { CreationTuple, DigitalEntity } from 'src/app/metadata';
import { SnackbarService } from 'src/app/services';

@Component({
  selector: 'app-creation',
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
  templateUrl: './creation.component.html',
  styleUrl: './creation.component.scss',
})
export class CreationComponent {
  @Input() entity!: DigitalEntity;

  public techniqueControl = new FormControl('');
  public softwareControl = new FormControl('');
  public equipmentControl = new FormControl('');
  public dateControl = new FormControl('', [this.dateFormValidator()]);

  constructor(private snackbar: SnackbarService) {}

  addNewCreationData() {
    const creationInstance = new CreationTuple({
      technique: this.techniqueControl.value ?? '',
      program: this.softwareControl.value ?? '',
      equipment: this.equipmentControl.value ?? '',
      date: this.dateControl.value ?? '',
    });

    // if (this.dateAlreadySet && this.dateControl.value !== '') {
    //   this.snackbar.showInfo('Creation date already set!');
    //   return;
    // }

    // if (CreationTuple.checkIsValid(creationInstance) && this.dateFormat) {
    if (this.dateFormat) {
      this.entity.creation.push(creationInstance);
      this.resetFormFields();
    }
  }

  get dateFormat(): boolean {
    return this.dateControl.valid;
  }

  get isFormValid(): boolean {
    return (
      this.techniqueControl.value !== '' ||
      this.softwareControl.value !== '' ||
      this.equipmentControl.value !== '' ||
      this.dateControl.value !== ''
    );
  }

  dateFormValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      const isValid = dateRegex.test(control.value);
      return isValid ? null : { invalidDateFormat: true };
    };
  }

  // get dateAlreadySet(): boolean {
  //   return this.entity.creation.some(set => !!set.date);
  // }

  resetFormFields() {
    this.techniqueControl.setValue('');
    this.softwareControl.setValue('');
    this.equipmentControl.setValue('');
    this.dateControl.setValue('');
  }
}
