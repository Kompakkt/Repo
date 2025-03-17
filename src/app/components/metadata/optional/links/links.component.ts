import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { MatButton } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

import { AnyEntity, DescriptionValueTuple } from 'src/app/metadata';
import { SnackbarService } from 'src/app/services';
import { TranslatePipe } from '../../../../pipes/translate.pipe';
import { OptionalCardListComponent } from '../optional-card-list/optional-card-list.component';

@Component({
  selector: 'app-links',
  standalone: true,
  imports: [
    CommonModule,
    MatButton,
    MatDividerModule,
    MatFormField,
    MatInput,
    MatLabel,
    ReactiveFormsModule,
    TranslatePipe,
    OptionalCardListComponent,
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
    }
  }

  resetFormFields(): void {
    this.valueControl.setValue('');
    this.descriptionControl.setValue('');
  }

  // Muss noch weg!
  public removeProperty(property: string, index: number) {
    if (Array.isArray(this.entity[property])) {
      const removed = this.entity[property].splice(index, 1)[0];
      if (!removed) {
        return console.warn('No item removed');
      }
    } else {
      console.warn(`Could not remove ${property} at ${index} from ${this.entity}`);
    }
  }

  public objectKeys(obj: any): string[] {
    return Object.keys(obj);
  }
}
