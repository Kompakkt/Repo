import { KeyValuePipe } from '@angular/common';
import { Component, inject, input, Pipe, PipeTransform } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  DataTupleKeyValuePipe,
  IsDescriptionValueTuple,
  IsDimensionTuple,
} from 'src/app/pipes/tuple-helper.pipes';
import { MetadataCommunicationService } from 'src/app/services/metadata-communication.service';
import type { DataTuple, IDescriptionValueTuple, IDimensionTuple } from 'src/common';

@Component({
  selector: 'app-optional-card-list',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    IsDimensionTuple,
    IsDescriptionValueTuple,
    DataTupleKeyValuePipe
],
  templateUrl: './optional-card-list.component.html',
  styleUrl: './optional-card-list.component.scss',
})
export class OptionalCardListComponent {
  #metadataCommunicationService = inject(MetadataCommunicationService);

  optionalData = input.required<DataTuple[]>();
  propertyType = input('');

  public onRemove(index: number) {
    this.optionalData().splice(index, 1);
  }

  public onSelectData(index: number) {
    this.#metadataCommunicationService.selectMetadata(this.optionalData()[index], index);
  }
}
