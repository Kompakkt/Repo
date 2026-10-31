import { Component, computed, model } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslatePipe } from 'src/app/pipes/translate.pipe';
import { OptionalCardListComponent } from '../optional-card-list/optional-card-list.component';
import { OutlinedInputComponent } from 'src/app/components/outlined-input/outlined-input.component';
import { form, FormField, required } from '@angular/forms/signals';
import { AnyEntity, emptyTypeValueTuple } from 'src/app/metadata';
import { isPhysicalEntity } from '@kompakkt/common';

@Component({
  selector: 'app-external-ids',
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
  templateUrl: './external-ids.component.html',
  styleUrl: './external-ids.component.scss',
})
export class ExternalIdsComponent {
  entity = model.required<AnyEntity>();

  tupleModel = model(emptyTypeValueTuple());
  tupleForm = form(this.tupleModel, path => {
    required(path.type);
    required(path.value);
  });
  isPhysical = computed(() => isPhysicalEntity(this.entity()));

  addNewIdentifier() {
    const { type, value } = this.tupleForm().value();
    this.entity.update(entity => {
      const clone = structuredClone(entity);
      const externalIds = [...clone.externalId];
      externalIds.push({ ...emptyTypeValueTuple(), type, value });
      return clone;
    });
    this.tupleForm().value.set(emptyTypeValueTuple());
  }
}
