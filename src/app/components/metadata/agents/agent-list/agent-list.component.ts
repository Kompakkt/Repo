import { CommonModule } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { AnyEntity, Institution, Person, PhysicalEntity } from 'src/app/metadata';
import { isDigitalEntity, isPhysicalEntity } from 'src/common/typeguards';

import { MetadataCommunicationService } from 'src/app/services/metadata-communication.service';
import { AgentCardComponent } from '../agent-card/agent-card.component';

@Component({
  selector: 'app-agent-list',
  standalone: true,
  imports: [AgentCardComponent, CommonModule],
  templateUrl: './agent-list.component.html',
  styleUrl: './agent-list.component.scss',
})
export class AgentListComponent {
  #metaService = inject(MetadataCommunicationService);

  entity = input.required<AnyEntity>();
  entityId = computed(() => this.entity()._id.toString());

  digitalEntity = computed(() => {
    const entity = this.entity();
    return isDigitalEntity(entity) ? entity : undefined;
  });

  physicalEntity = computed(() => {
    const entity = this.entity();
    return isPhysicalEntity(entity) ? (entity as PhysicalEntity) : undefined;
  });

  removeAgentRole(agent: Person | Institution, role: string) {
    const entity = this.entity();
    const entityId = this.entityId();

    const agentType = agent instanceof Person ? 'persons' : 'institutions';

    if (Array.isArray(entity[agentType])) {
      const currentAgent = entity[agentType].find(a => a._id == agent._id);

      if (!currentAgent) return;

      const roleIndex = currentAgent.roles[entityId].indexOf(role);

      if (roleIndex > -1) {
        currentAgent.roles[entityId].splice(roleIndex, 1);
      }

      if (currentAgent.roles[entityId].length === 0) {
        delete currentAgent.roles[entityId];
        const agentsArray = entity[agentType] as Array<Person | Institution>;
        const agentIndex = agentsArray.indexOf(currentAgent);
        if (agentIndex > -1) {
          agentsArray.splice(agentIndex, 1);
        }
      }
    }

    this.#metaService.setEntity(entity);
  }
}
