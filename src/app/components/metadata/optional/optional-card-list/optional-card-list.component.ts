import { Component, computed, input, model, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  DataTupleKeyValuePipe,
  IsDescriptionValueTuple,
  IsDimensionTuple,
} from 'src/app/pipes/tuple-helper.pipes';
import type { DataTuple, IDigitalEntityResolved, IPhysicalEntityResolved } from '@kompakkt/common';
import { AnyEntity } from 'src/app/metadata';

type AllowedPropertyType = keyof Pick<
  IPhysicalEntityResolved & IDigitalEntityResolved,
  'biblioRefs' | 'externalId' | 'externalLink' | 'creation' | 'dimensions'
>;

@Component({
  selector: 'app-optional-card-list',
  imports: [
    MatIconModule,
    MatButtonModule,
    IsDimensionTuple,
    IsDescriptionValueTuple,
    DataTupleKeyValuePipe,
  ],
  templateUrl: './optional-card-list.component.html',
  styleUrl: './optional-card-list.component.scss',
})
export class OptionalCardListComponent {
  entity = model.required<AnyEntity>();
  propertyType = input.required<AllowedPropertyType>();
  optionalData = computed(() => {
    const entity = this.entity();
    const property = this.propertyType();
    return entity[property];
  });

  selected = output<number>();

  onRemove(index: number) {
    const property = this.propertyType();
    this.entity.update(entity => ({
      ...entity,
      [property]: [...entity[property].filter((_, i) => index !== i)],
    }));
  }
}
