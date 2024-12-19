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

import { SnackbarService } from 'src/app/services';
import { TranslatePipe } from '../../../../pipes/translate.pipe';
import { AnyEntity, DescriptionValueTuple, DigitalEntity } from 'src/app/metadata';

@Component({
  selector: 'app-links',
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
  templateUrl: './links.component.html',
  styleUrl: './links.component.scss',
})
export class LinksComponent {
  @Input() entity!: AnyEntity;

  public valueControl = new FormControl('');
  public descriptionControl = new FormControl('');

  constructor(private snackbar: SnackbarService) {}

  get isLinkDataValid(): boolean {
    return this.valueControl.value !== '' && this.descriptionControl.value !== '';
  }

  addNewLinkData(): void {
    const linkInstance = new DescriptionValueTuple({
      value: this.valueControl.value ?? '',
      description: this.descriptionControl.value ?? '',
    });

    if (this.isLinkDataValid && DescriptionValueTuple.checkIsValid(linkInstance)) {
      this.entity.externalLink.push(linkInstance);
      this.resetFormFields();
      console.log(this.entity);
    }
  }

  resetFormFields(): void {
    this.valueControl.setValue('');
    this.descriptionControl.setValue('');
  }
}
