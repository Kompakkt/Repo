import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { AnyEntity, Institution, Person, PhysicalEntity } from '../metadata';
import { DataTuple } from 'src/common';

@Injectable({
  providedIn: 'root',
})
export class MetadataCommunicationService {
  readonly selectedMetadata$ = new BehaviorSubject<{ data: DataTuple; index: number } | null>(null);
  readonly selectedAgent$ = new BehaviorSubject<{
    agent: Person | Institution;
    entityId: string;
  } | null>(null);
  readonly physicalEntity$ = new BehaviorSubject<PhysicalEntity | undefined>(undefined);
  private refreshSubject = new Subject<void>();
  readonly refresh$ = this.refreshSubject.asObservable();

  #entitySubjects = new Map<string, BehaviorSubject<AnyEntity | null>>();

  selectMetadata(metadata: DataTuple, index: number) {
    this.selectedMetadata$.next({ data: metadata, index: index });
  }

  selectAgent(obj: { agent: Person | Institution; entityId: string } | null) {
    this.selectedAgent$.next(obj);
  }

  setEntity(entity: AnyEntity) {
    const id = entity._id?.toString();
    if (!id || id.length === 0) throw new Error('Entity must have a valid _id');
    if (!this.#entitySubjects.has(id)) {
      this.#entitySubjects.set(id, new BehaviorSubject<AnyEntity | null>(null));
    }
    this.#entitySubjects.get(id)?.next(entity);
  }

  getSelectedEntity$(entityId: string): Observable<AnyEntity | null> {
    if (!this.#entitySubjects.has(entityId)) {
      this.#entitySubjects.set(entityId, new BehaviorSubject<AnyEntity | null>(null));
    }
    return this.#entitySubjects.get(entityId)!.asObservable();
  }

  updatePhysicalEntity(newPhysicalObject: PhysicalEntity) {
    this.physicalEntity$.next(newPhysicalObject);
  }

  triggerRefresh() {
    this.refreshSubject.next();
  }
}
