import { Component, input, ChangeDetectionStrategy, output, model } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  DataTupleKeyValuePipe,
  IsDescriptionValueTuple,
  IsDimensionTuple,
} from 'src/app/pipes/tuple-helper.pipes';
import type { DataTuple } from '@kompakkt/common';

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
  optionalData = model.required<DataTuple[]>();
  propertyType = input('');

  selected = output<number>();

  public onRemove(index: number) {
    this.optionalData.update(data => {
      const clone = [...data];
      clone.splice(index, 1);
      return clone;
    });
  }
}
