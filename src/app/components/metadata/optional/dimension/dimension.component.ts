import { Component, model } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslatePipe } from 'src/app/pipes/translate.pipe';
import { OptionalCardListComponent } from '../optional-card-list/optional-card-list.component';
import { OutlinedInputComponent } from 'src/app/components/outlined-input/outlined-input.component';
import { form, FormField, required } from '@angular/forms/signals';
import { IPhysicalEntityResolved } from '@kompakkt/common';
import { emptyDimensionTuple } from 'src/app/metadata';

@Component({
  selector: 'app-dimension',
  imports: [
    FormField,
    MatButtonModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    TranslatePipe,
    OptionalCardListComponent,
    OutlinedInputComponent,
  ],
  templateUrl: './dimension.component.html',
  styleUrl: './dimension.component.scss',
})
export class DimensionComponent {
  entity = model.required<IPhysicalEntityResolved>();

  dimensionModel = model(emptyDimensionTuple());
  dimensionForm = form(this.dimensionModel, path => {
    required(path.name);
    required(path.type);
    required(path.value);
  });

  addNewDimensionData() {
    const data = this.dimensionForm().value();
    this.entity.update(entity => {
      const clone = structuredClone(entity);
      clone.dimensions = [...clone.dimensions, { ...emptyDimensionTuple(), ...data }];
      return clone;
    });
    this.dimensionForm().value.set(emptyDimensionTuple());
  }
}
