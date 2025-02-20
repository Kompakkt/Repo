import {ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { formatDate } from '@angular/common';
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
import { MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {provideNativeDateAdapter} from '@angular/material/core';

import { TranslatePipe } from '../../../../pipes/translate.pipe';
import { CreationTuple, DigitalEntity } from 'src/app/metadata';
import { SnackbarService } from 'src/app/services';
import { OptionalCardListComponent } from "../optional-card-list/optional-card-list.component";

@Component({
  selector: 'app-creation',
  standalone: true,
  imports: [
    MatButton,
    MatDatepickerModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatLabel,
    ReactiveFormsModule,
    TranslatePipe,
    OptionalCardListComponent
],
  templateUrl: './creation.component.html',
  styleUrl: './creation.component.scss',
  providers: [provideNativeDateAdapter()],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreationComponent {
  @Input() entity!: DigitalEntity;

  public techniqueControl = new FormControl('');
  public softwareControl = new FormControl('');
  public equipmentControl = new FormControl('');
  // public dateControl = new FormControl('', [this.dateFormValidator()]);
  public dateControl = new FormControl('');

  private readonly _currentYear = new Date().getFullYear();
  readonly minDate = new Date(this._currentYear - 20, 0, 1);

  constructor(private snackbar: SnackbarService) {
  }

  addNewCreationData() {
    console.log(this.entity);
    const value = this.dateControl.value;

    const creationInstance = new CreationTuple({
      technique: this.techniqueControl.value ?? '',
      program: this.softwareControl.value ?? '',
      equipment: this.equipmentControl.value ?? '',
      date: value ? formatDate(value, 'yyyy-dd-MM', 'en-US') : '',
    });

    this.resetFormFields();

    console.log(creationInstance);
    this.entity.creation.push(creationInstance);
  }

  get dateFormat(): boolean {

    return this.dateControl.valid;
  }

  get isFormValid(): boolean {
    return (
      this.techniqueControl.value !== '' ||
      this.softwareControl.value !== '' ||
      this.equipmentControl.value !== ''
      // this.dateControl.value !== ''
    );
  }

  dateFormValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      // const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
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
    // this.dateControl.setValue('');
  }
}
