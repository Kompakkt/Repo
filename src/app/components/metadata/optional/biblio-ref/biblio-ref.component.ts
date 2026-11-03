import { Component, computed, model, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { DataTuple, isPhysicalEntity } from '@kompakkt/common';
import { TranslatePipe } from '../../../../pipes/translate.pipe';
import { OptionalCardListComponent } from '../optional-card-list/optional-card-list.component';
import { OutlinedInputComponent } from 'src/app/components/outlined-input/outlined-input.component';
import { disabled, form, FormField, minLength } from '@angular/forms/signals';
import { createWrappedModel, UnwrappedModelKeys, WrappedModel } from '../../metadata-util';
import { AnyEntity, emptyDescriptionValueTuple } from 'src/app/metadata';

type BiblioRefModel = WrappedModel<{
  reference: string;
  description: string;
}>;

@Component({
  selector: 'app-biblio-ref',
  imports: [
    FormField,
    MatButtonModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    TranslatePipe,
    OptionalCardListComponent,
    OutlinedInputComponent,
  ],
  templateUrl: './biblio-ref.component.html',
  styleUrl: './biblio-ref.component.scss',
})
export class BiblioRefComponent {
  public entity = model.required<AnyEntity>();
  isPhysical = computed(() => isPhysicalEntity(this.entity()));

  biblioRefModel = model<BiblioRefModel>(createWrappedModel({ reference: '', description: '' }));
  biblioRefForm = form(this.biblioRefModel, path => {
    minLength(path.description, 1);
    minLength(path.reference, 1);
    disabled(path.description, {
      when: schema =>
        schema.valueOf(path.__prefilled) && !schema.valueOf(path.__editing).includes('description'),
    });
    disabled(path.reference, {
      when: schema =>
        schema.valueOf(path.__prefilled) && !schema.valueOf(path.__editing).includes('reference'),
    });
  });
  isPrefilled = computed(() => this.biblioRefForm().value().__prefilled);

  private dataIndex = signal(0);

  selectForEdit(index: number) {
    const ref = this.entity().biblioRefs.at(index);
    if (!ref) throw new Error('Ref does not exist');
    this.dataIndex.set(index);
    this.setDataInForm(ref);
  }

  addNewBiblioData(): void {
    if (this.biblioRefForm().invalid()) throw new Error('Invalid');
    const { reference, description } = this.biblioRefForm().value();
    this.entity.update(entity => {
      const clone = structuredClone(entity);
      clone.biblioRefs = [
        ...clone.biblioRefs,
        { ...emptyDescriptionValueTuple(), value: reference, description },
      ];
      return clone;
    });
    this.resetFormFields();
  }

  updateMetadata(): void {
    if (this.biblioRefForm().invalid()) throw new Error('Invalid');
    const { reference, description } = this.biblioRefForm().value();
    const index = this.dataIndex();
    this.entity.update(entity => {
      const clone = structuredClone(entity);
      const biblioRefs = [...clone.biblioRefs];
      biblioRefs[index] = { ...emptyDescriptionValueTuple(), value: reference, description };
      clone.biblioRefs = biblioRefs;
      return clone;
    });
    this.resetFormFields();
  }

  onEditData(field: UnwrappedModelKeys<BiblioRefModel>): void {
    this.biblioRefForm().value.update(v => {
      const hasValue = v.__editing.includes(field);
      return {
        ...v,
        __editing: hasValue ? v.__editing.filter(f => f !== field) : v.__editing.concat(field),
      };
    });
  }

  setDataInForm(biblioData: DataTuple) {
    if ('value' in biblioData && 'description' in biblioData) {
      this.biblioRefForm().value.update(v => ({
        ...v,
        description: biblioData.description,
        reference: biblioData.value,
        __prefilled: true,
      }));
    }
  }

  resetFormFields(): void {
    this.biblioRefForm().value.set(
      createWrappedModel({
        description: '',
        reference: '',
      }),
    );
  }
}
