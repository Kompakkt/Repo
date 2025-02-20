import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { AnyEntity, DigitalEntity, DimensionTuple } from 'src/app/metadata';
import { TranslatePipe } from 'src/app/pipes';
import { MatDividerModule } from '@angular/material/divider';
import { OptionalCardListComponent } from "../optional-card-list/optional-card-list.component";

@Component({
  selector: 'app-dimension',
  standalone: true,
  imports: [
    CommonModule,
    MatButton,
    MatDividerModule,
    MatFormField,
    MatIcon,
    MatIconButton,
    MatInput,
    MatLabel,
    ReactiveFormsModule,
    TranslatePipe,
    OptionalCardListComponent
],
  templateUrl: './dimension.component.html',
  styleUrl: './dimension.component.scss'
})
export class DimensionComponent {
  @Input() entity!: DigitalEntity;

  public nameControl = new FormControl('');
  public valueControl = new FormControl('');
  public typeControl = new FormControl('');

  private formControlList: FormControl[] = [];

  constructor() {
    this.formControlList = Object.values(this).filter(control => control instanceof FormControl) as FormControl[];
  }

  get isDimensionValid(): boolean {
    return (
      this.nameControl.value !== '' && 
      this.valueControl.value !== '' && 
      this.typeControl.value !== '');
  }

  protected addNewDimensionData(): void {
    const dimensionInstance = new DimensionTuple({
      name: this.nameControl.value ?? '',
      value: this.valueControl.value ?? '',
      type: this.typeControl.value ?? ''
    });

    if(this.isDimensionValid && DimensionTuple.checkIsValid(dimensionInstance)) {
      this.entity.dimensions.push(dimensionInstance);
      this.resetFormFields();
    }
  }

  private resetFormFields(): void {
    this.formControlList.forEach(control => {
      control.reset();
    });
  }

    // Muss noch weg!
    // public removeProperty(property: string, index: number) {
    //   if (Array.isArray(this.entity[property])) {
    //     const removed = this.entity[property].splice(index, 1)[0];
    //     if (!removed) {
    //       return console.warn('No item removed');
    //     }
    //   } else {
    //     console.warn(`Could not remove ${property} at ${index} from ${this.entity}`);
    //   }
    // }

    // public objectKeys(obj: any): string[] {
    //   return Object.keys(obj);
    // }
}
