import { Component, model } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { cloneEntity, DimensionTuple, PhysicalEntity } from 'src/app/metadata';
import { TranslatePipe } from 'src/app/pipes/translate.pipe';
import { OptionalCardListComponent } from '../optional-card-list/optional-card-list.component';
import { OutlinedInputComponent } from 'src/app/components/outlined-input/outlined-input.component';
import { form, FormField, required } from '@angular/forms/signals';

const emptyDimensionTuple = () => ({ name: '', value: '', type: '' });

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
  entity = model.required<PhysicalEntity>();

  dimensionModel = model(emptyDimensionTuple());
  dimensionForm = form(this.dimensionModel, path => {
    required(path.name);
    required(path.type);
    required(path.value);
  });

  addNewDimensionData() {
    const { name, value, type } = this.dimensionForm().value();
    this.entity.update(entity => {
      const clone = cloneEntity(entity) as PhysicalEntity;
      const dimensions = [...clone.dimensions];
      dimensions.push(new DimensionTuple({ name, value, type }));
      return clone;
    });
    this.dimensionForm().value.set(emptyDimensionTuple());
  }
}
