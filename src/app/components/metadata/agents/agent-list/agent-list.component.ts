import { CommonModule } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { AnyEntity, Institution, Person, PhysicalEntity } from 'src/app/metadata';
import { isDigitalEntity, isPhysicalEntity } from 'src/common/typeguards';

import { MetadataCommunicationService } from 'src/app/services/metadata-communication.service';
import { GetPersonContactReferencePipe } from 'src/app/pipes/get-person-contact-reference.pipe';
import { GetInstitutionAddressPipe } from 'src/app/pipes/get-institution-address.pipe';
import { GetPersonOrInstitutionRolesPipe } from 'src/app/pipes/get-person-or-institution-roles.pipe';
import { MetadataRoles } from 'src/app/metadata/roles';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TranslatePipe } from 'src/app/pipes';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-agent-list',
  standalone: true,
  imports: [
    CommonModule,
    GetPersonContactReferencePipe,
    GetInstitutionAddressPipe,
    GetPersonOrInstitutionRolesPipe,
    MatIconModule,
    MatButtonModule,
    TranslatePipe,
  ],
  templateUrl: './agent-list.component.html',
  styleUrl: './agent-list.component.scss',
})
export class AgentListComponent {
  #metaService = inject(MetadataCommunicationService);

  readonly metadataRoles = MetadataRoles;

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

  removeAgent(agent: Person | Institution) {}

  removeAgentRole(agent: Person | Institution, role: string) {
    const agentType = agent instanceof Person ? 'persons' : 'institutions';
    if (Array.isArray(this.entity()[agentType])) {
      const currentAgent = this.entity()[agentType].find(a => a._id == agent._id);
      if (currentAgent) {
        const roleIndex = currentAgent.roles[this.entityId()].indexOf(role);
        if (roleIndex > -1) {
          currentAgent.roles[this.entityId()].splice(roleIndex, 1);
        }

        if (currentAgent.roles[this.entityId()].length == 0) {
          const agentIndex = this.entity()[agentType].indexOf(currentAgent as any);
          this.entity()[agentType].splice(agentIndex, 1)[0];
        }
      }
    }

    this.#metaService.setEntity(this.entity());
  }

  onSelectAgent(agent: Person | Institution) {
    this.#metaService.selectAgent({ agent, entityId: this.entityId() });
  }
}
