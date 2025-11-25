import { Component, computed, input } from '@angular/core';
import { IDigitalEntityForm } from '../base-signal-child-component';
import { MatIconModule } from '@angular/material/icon';
import { DataTuple, IDigitalEntity } from 'src/common';
import {
  DataTupleKeyValuePipe,
  IsDescriptionValueTuple,
  IsDimensionTuple,
} from 'src/app/pipes/tuple-helper.pipes';
import { MatButtonModule } from '@angular/material/button';
import { SignalCardComponent } from '../signal-card/signal-card.component';

@Component({
  selector: 'app-signal-optional-card-list',
  imports: [
    MatIconModule,
    MatButtonModule,
    SignalCardComponent,
    DataTupleKeyValuePipe,
    IsDescriptionValueTuple,
    IsDimensionTuple,
  ],
  templateUrl: './signal-optional-card-list.component.html',
  styleUrl: './signal-optional-card-list.component.scss',
})
export class SignalOptionalCardListComponent {
  entityForm = input.required<IDigitalEntityForm>();

  propertyType = input.required<
    'dimensions' | 'creation' | 'externalId' | 'externalLink' | 'biblioRefs' | 'other'
  >();
  optionalData = computed<DataTuple[]>(() => {
    const propertyType = this.propertyType();
    const entityFormValue = this.entityForm()().value();
    return entityFormValue[propertyType];
  });

  onSelectData(index: number) {}

  onRemove(index: number) {
    this.entityForm()().value.update(state => {
      const arr = [...state[this.propertyType()]];
      arr.splice(index, 1);
      return { ...state, [this.propertyType()]: arr };
    });
  }
}
