import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { Person } from "../metadata";

@Injectable({
    providedIn: 'root' 
})

export class MetadataCommunicationService {
    private metadataSubject = new BehaviorSubject<{data: any, index: number} | null>(null);
    selectedMetadata$ = this.metadataSubject.asObservable();

    private selectedAgentSubject = new BehaviorSubject<{ agent: Person, entityId: string } | null>(null);
    selectedAgent$ = this.selectedAgentSubject.asObservable();

    selectMetadata(metadata, index) {
        this.metadataSubject.next({data: metadata, index: index});
    }

    selectAgent(agent, entityId) {
        this.selectedAgentSubject.next({ agent, entityId });
    }
}