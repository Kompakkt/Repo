import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { AnyEntity, Person } from "../metadata";

@Injectable({
    providedIn: 'root' 
})

export class MetadataCommunicationService {
    private metadataSubject = new BehaviorSubject<{data: any, index: number} | null>(null);
    selectedMetadata$ = this.metadataSubject.asObservable();

    private selectedAgentSubject = new BehaviorSubject<{ agent: Person, entityId: string } | null>(null);
    selectedAgent$ = this.selectedAgentSubject.asObservable();

    private entitySubjects = new Map<string, BehaviorSubject<AnyEntity | null>>();

    selectMetadata(metadata, index) {
        this.metadataSubject.next({data: metadata, index: index});
    }

    selectAgent(agent, entityId) {
        this.selectedAgentSubject.next({ agent, entityId });
    }

    setEntity(entity, entityId) {
        if (!this.entitySubjects.has(entityId)) {
            this.entitySubjects.set(entityId, new BehaviorSubject<AnyEntity | null>(null));
        }
        this.entitySubjects.get(entityId)?.next(entity);
    }

    getSelectedEntity$(entityId: string): Observable<AnyEntity | null> {
        if (!this.entitySubjects.has(entityId)) {
          this.entitySubjects.set(entityId, new BehaviorSubject<AnyEntity | null>(null));
        }
        return this.entitySubjects.get(entityId)!.asObservable();
      }
}