import { InputSignal } from '@angular/core';
import { FieldTree } from '@angular/forms/signals';
import { IDigitalEntity } from 'src/common';

export type IDigitalEntityForm = FieldTree<IDigitalEntity<Record<string, unknown>, true>>;

export interface IBaseSignalChildComponent {
  entityForm: InputSignal<IDigitalEntityForm>;
}
