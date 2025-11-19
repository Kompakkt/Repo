
import { Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DigitalEntity, DimensionTuple } from 'src/app/metadata';
import { TranslatePipe } from 'src/app/pipes';
import { OptionalCardListComponent } from '../optional-card-list/optional-card-list.component';

@Component({
  selector: 'app-dimension',
  standalone: true,
  imports: [
    MatButtonModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    TranslatePipe,
    OptionalCardListComponent
],
  templateUrl: './dimension.component.html',
  styleUrl: './dimension.component.scss',
})
export class DimensionComponent {
  public entity = input.required<DigitalEntity>();

  public nameControl = new FormControl('', { nonNullable: true });
  public valueControl = new FormControl('', { nonNullable: true });
  public typeControl = new FormControl('', { nonNullable: true });

  get isDimensionValid(): boolean {
    return (
      this.nameControl.value !== '' &&
      this.valueControl.value !== '' &&
      this.typeControl.value !== ''
    );
  }

  protected addNewDimensionData(): void {
    const dimensionInstance = new DimensionTuple({
      name: this.nameControl.value ?? '',
      value: this.valueControl.value ?? '',
      type: this.typeControl.value ?? '',
    });

    if (dimensionInstance.isValid) {
      this.entity().dimensions.push(dimensionInstance);
      this.resetFormFields();
    }
  }

  private resetFormFields(): void {
    this.nameControl.reset();
    this.valueControl.reset();
    this.typeControl.reset();
  }
}
