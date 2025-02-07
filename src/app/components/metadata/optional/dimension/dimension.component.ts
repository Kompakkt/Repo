import { Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { AnyEntity, DigitalEntity, DimensionTuple } from 'src/app/metadata';
import { TranslatePipe } from 'src/app/pipes';

@Component({
  selector: 'app-dimension',
  standalone: true,
  imports: [
    MatButton,
    MatFormField,
    MatInput,
    MatLabel,
    ReactiveFormsModule,
    TranslatePipe,
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
}
