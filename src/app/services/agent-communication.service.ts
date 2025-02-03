import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

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