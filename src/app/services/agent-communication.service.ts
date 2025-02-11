import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { AnyEntity } from "../metadata";

@Injectable({
    providedIn: 'root'
})
export class AgentCommunicationService {
    private selectedAgentSubject = new BehaviorSubject(null);
    selectedAgent$ = this.selectedAgentSubject.asObservable();

    selectAgent(agent) {
        this.selectedAgentSubject.next(agent);
    }
}