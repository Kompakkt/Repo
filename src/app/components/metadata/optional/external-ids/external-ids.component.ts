import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { DigitalEntity, TypeValueTuple } from 'src/app/metadata';
import { TranslatePipe } from 'src/app/pipes';
import { OptionalCardListComponent } from '../optional-card-list/optional-card-list.component';

@Component({
  selector: 'app-external-ids',
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
  templateUrl: './external-ids.component.html',
  styleUrl: './external-ids.component.scss',
})
export class ExternalIdsComponent {
  @Input() entity!: DigitalEntity;

  public valueControl = new FormControl('');
  public typeControl = new FormControl('');

  private formControlList: FormControl[] = [];

  constructor() {
    this.formControlList = Object.values(this).filter(
      control => control instanceof FormControl,
    ) as FormControl[];
  }

  get isExternalIdentifiersValid(): boolean {
    return this.typeControl.value !== '' && this.valueControl.value !== '';
  }

  protected addNewIdentifier(): void {
    const identifierInstance = new TypeValueTuple({
      value: this.valueControl.value ?? '',
      type: this.typeControl.value ?? '',
    });

    console.log(identifierInstance);

    if (this.isExternalIdentifiersValid && TypeValueTuple.checkIsValid(identifierInstance)) {
      this.entity.externalId.push(identifierInstance);
      this.resetFormFields();
    }
  }

  private resetFormFields(): void {
    this.formControlList.forEach(control => {
      control.reset();
    });
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
