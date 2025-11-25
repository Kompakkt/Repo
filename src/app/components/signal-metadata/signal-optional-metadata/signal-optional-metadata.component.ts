import { Component, computed, effect, input, signal, WritableSignal } from '@angular/core';
import { IDigitalEntityForm } from '../base-signal-child-component';
import { DataTuple, IDimensionTuple } from 'src/common';
import { Field, FieldTree, form, required } from '@angular/forms/signals';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { TranslatePipe } from 'src/app/pipes';
import { SignalOptionalCardListComponent } from '../signal-optional-card-list/signal-optional-card-list.component';
import {
  createCreationTuple,
  createDescriptionValueTuple,
  createDimensionTuple,
  createTypeValueTuple,
} from '..';
import { Data } from '@angular/router';
import { KeyValuePipe } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';

type PropertyType =
  | 'dimensions'
  | 'creation'
  | 'externalId'
  | 'externalLink'
  | 'biblioRefs'
  | 'other';

const createDataByPropertyType = (propertType: PropertyType): DataTuple => {
  switch (propertType) {
    case 'dimensions': {
      return createDimensionTuple();
    }
    case 'creation': {
      return createCreationTuple();
    }
    case 'externalId': {
      return createTypeValueTuple();
    }
    default: {
      return createDescriptionValueTuple();
    }
  }
};

const createDescriptionValueTupleLabel = () => ({
  description: { label: 'Description', placeholder: 'Enter a description' },
  value: { label: 'Value', placeholder: 'Enter a value' },
});

@Component({
  selector: 'app-signal-optional-metadata',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDividerModule,
    Field,
    TranslatePipe,
    KeyValuePipe,
    SignalOptionalCardListComponent,
  ],
  templateUrl: './signal-optional-metadata.component.html',
  styleUrl: './signal-optional-metadata.component.scss',
})
export class SignalOptionalMetadataComponent {
  entityForm = input.required<IDigitalEntityForm>();
  propertyType = input.required<PropertyType>();

  data = signal<DataTuple | undefined>(undefined);
  dataForm = form(this.data, fieldPath => {});

  isInvalid = computed(() => {
    return this.dataForm?.().invalid() ?? true;
  });

  labels = {
    dimensions: {
      name: { label: 'Unit description (e.g. Width of base)', placeholder: 'Enter a description' },
      type: { label: 'Unit value', placeholder: 'Enter a value' },
      value: { label: 'Unit type', placeholder: 'Enter a type' },
    },
    creation: {
      technique: { label: 'Add technique (e.g. Laserscan or Modelling)', placeholder: '' },
      program: { label: 'Add program', placeholder: '' },
      equipment: { label: 'Add equipment', placeholder: '' },
      date: { label: 'Add creation date (format: mm/dd/yyyy)', placeholder: '' },
    },
    externalId: {
      type: { label: 'Type', placeholder: 'Enter a type' },
      value: { label: 'Value', placeholder: 'Enter a value' },
    },
    biblioRefs: createDescriptionValueTupleLabel(),
    externalLink: createDescriptionValueTupleLabel(),
    other: createDescriptionValueTupleLabel(),
  } as const satisfies Record<PropertyType, Record<string, { label: string; placeholder: string }>>;

  constructor() {
    let ref = effect(() => {
      const propertyType = this.propertyType();
      console.log(`Setting up form for ${propertyType}`);
      this.data.set(createDataByPropertyType(propertyType));
      this.dataForm().reset();
      ref.destroy();
    });
  }

  addNewData() {
    const newData = this.dataForm().value();
    const propertyType = this.propertyType();
    this.entityForm()().value.update(state => ({
      ...state,
      [propertyType]: [...state[propertyType], newData],
    }));
    this.data.set(createDataByPropertyType(propertyType));
    this.dataForm().reset();
  }
}
