import { Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { AnyEntity, DigitalEntity, DimensionTuple, TypeValueTuple } from 'src/app/metadata';
import { TranslatePipe } from 'src/app/pipes';

@Component({
  selector: 'app-external-ids',
  standalone: true,
  imports: [
        MatButton,
        MatFormField,
        MatInput,
        MatLabel,
        ReactiveFormsModule,
        TranslatePipe,
  ],
  templateUrl: './external-ids.component.html',
  styleUrl: './external-ids.component.scss'
})
export class ExternalIdsComponent {
  @Input() entity!: DigitalEntity;

  public valueControl = new FormControl('');
  public typeControl = new FormControl('');

  private formControlList: FormControl[] = [];

  constructor() {
    this.formControlList = Object.values(this).filter(control => control instanceof FormControl) as FormControl[];
  }

  get isExternalIdentifiersValid(): boolean {
    return (
      this.typeControl.value !== '' &&
      this.valueControl.value !== ''
    );
  }

  protected addNewIdentifier(): void {
    const identifierInstance = new TypeValueTuple({
      value: this.valueControl.value ?? '',
      type: this.typeControl.value ?? ''
    });

    if(this.isExternalIdentifiersValid && TypeValueTuple.checkIsValid(identifierInstance)) {
      this.entity.externalId.push(identifierInstance);
      this.resetFormFields();
    }
  }

  private resetFormFields(): void {
    this.formControlList.forEach(control => {
      control.reset();
    });
  }

}
