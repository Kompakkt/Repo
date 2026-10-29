import { Service, signal } from '@angular/core';
import { Institution, Person, PhysicalEntity } from '../metadata';
import { DataTuple } from '@kompakkt/common';

export type SelectedMetadata = {
  data: DataTuple;
  index: number;
};
export type SelectedAgent = {
  agent: Person | Institution;
  entityId: string;
};

@Service()
export class MetadataCommunicationService {
  readonly selectedAgent = signal<SelectedAgent | null>(null);
  readonly physicalEntity = signal<PhysicalEntity | undefined>(undefined);
}
