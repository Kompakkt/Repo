import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { AnyEntity, Person } from "../metadata";

@Injectable({
    providedIn: 'root'
})
export class AgentCommunicationService {
    private selectedAgentSubject = new BehaviorSubject<{ agent: Person, entityId: string } | null>(null);
    selectedAgent$ = this.selectedAgentSubject.asObservable();

    selectAgent(agent, entityId) {
        this.selectedAgentSubject.next({ agent, entityId });
    }
}