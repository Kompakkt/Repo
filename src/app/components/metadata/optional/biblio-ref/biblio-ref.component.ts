import { Component, Input } from '@angular/core';
import {
  FormControl,
  ReactiveFormsModule,
} from '@angular/forms';

import { MatButton, MatIconButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

import { TranslatePipe } from '../../../../pipes/translate.pipe';
import { AnyEntity, DescriptionValueTuple} from 'src/app/metadata';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { OptionalCardListComponent } from "../optional-card-list/optional-card-list.component";
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-biblio-ref',
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
    OptionalCardListComponent
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
