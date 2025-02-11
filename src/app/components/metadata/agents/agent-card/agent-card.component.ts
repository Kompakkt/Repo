import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { Institution, Person } from 'src/app/metadata';
import { AgentCommunicationService } from 'src/app/services/agent-communication.service';

@Component({
  selector: 'app-agent-card',
  standalone: true,
  imports: [CommonModule, MatIcon, MatIconButton],
  templateUrl: './agent-card.component.html',
  styleUrl: './agent-card.component.scss',
})
export class AgentCardComponent {
  @Input() agent: any;
  @Input() entityId: any;
  @Output() remove = new EventEmitter<any>();

  constructor(private agentService: AgentCommunicationService) {
  }

  isPerson(agent: Person | Institution): agent is Person {
    return (agent as Person).fullName !== undefined;
  }

  isInstitution(agent: Person | Institution): agent is Institution {
    return (agent as Institution).addresses !== undefined;
  }

  onSelechtAgent() {
    this.agentService.selectAgent(this.agent);
  }

    ngOnChanges(changes: SimpleChanges) {
      console.log(this.entityId);
    }
}
