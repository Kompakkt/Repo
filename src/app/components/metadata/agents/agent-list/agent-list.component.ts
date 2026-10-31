import { Component, computed, model, output } from '@angular/core';
import {
  IInstitutionResolved,
  IPersonResolved,
  isPerson,
  isPhysicalEntity,
} from '@kompakkt/common';
import { AgentCardComponent } from '../agent-card/agent-card.component';
import { AnyEntity } from 'src/app/metadata';
import { DEFAULT_ROLE_TYPES, formatRoleLabel } from '../shared';

@Component({
  selector: 'app-agent-list',
  imports: [AgentCardComponent],
  templateUrl: './agent-list.component.html',
  styleUrl: './agent-list.component.scss',
})
export class AgentListComponent {
  entity = model.required<AnyEntity>();
  entityId = computed(() => this.entity()._id.toString());

  rightsOwners = computed(() => {
    const { persons, institutions, _id } = this.entity();
    return [...persons, ...institutions].filter(a => a.roles[_id].includes('RIGHTS_OWNER'));
  });
  contactPersons = computed(() => {
    const { persons, institutions, _id } = this.entity();
    return [...persons, ...institutions].filter(a => a.roles[_id].includes('CONTACT_PERSON'));
  });
  customRoleAgents = computed(() => {
    const { persons, institutions, _id } = this.entity();
    const customRoles = [...persons, ...institutions].flatMap(a =>
      a.roles[_id].filter(role => !DEFAULT_ROLE_TYPES.includes(role)),
    );
    const uniqueCustomRoles = Array.from(new Set(customRoles));
    return uniqueCustomRoles.map(role => ({
      role,
      label: formatRoleLabel(role),
      agents: [...persons, ...institutions].filter(a => a.roles[_id].includes(role)),
    }));
  });

  rightsOwnerTitleClass = computed(() => {
    const entity = this.entity();
    const rightsOwners = this.rightsOwners();
    if (isPhysicalEntity(entity)) return '';
    return rightsOwners.length > 0 ? 'black-text' : 'accent-text';
  });

  contactPersonTitleClass = computed(() => {
    const entity = this.entity();
    const contactPersons = this.contactPersons();
    if (isPhysicalEntity(entity)) return '';
    return contactPersons.length > 0 ? 'black-text' : 'accent-text';
  });

  selectAgent = output<IPersonResolved | IInstitutionResolved>();

  removeAgentRole(agent: IPersonResolved | IInstitutionResolved, role: string) {
    const entityId = this.entityId();
    const agentType = isPerson(agent) ? 'persons' : 'institutions';
    this.entity.update(entity => {
      const clone = structuredClone(entity);
      if (!Array.isArray(clone[agentType])) return clone;
      const currentAgent = clone[agentType].find(a => a._id == agent._id);

      if (!currentAgent) return clone;

      const roleIndex = currentAgent.roles[entityId].indexOf(role);

      if (roleIndex > -1) {
        currentAgent.roles[entityId].splice(roleIndex, 1);
      }

      if (currentAgent.roles[entityId].length === 0) {
        delete currentAgent.roles[entityId];
        const agentsArray = clone[agentType] as Array<IPersonResolved | IInstitutionResolved>;
        const agentIndex = agentsArray.indexOf(currentAgent);
        if (agentIndex > -1) {
          agentsArray.splice(agentIndex, 1);
        }
      }

      return clone;
    });
  }
}
