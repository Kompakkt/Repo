import { Component, computed, input, model, output } from '@angular/core';
import { IInstitutionResolved, IPersonResolved, isPhysicalEntity } from '@kompakkt/common';
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
  agents = model.required<Array<IPersonResolved | IInstitutionResolved>>();
  entity = input.required<AnyEntity>();

  rightsOwners = computed(() => {
    const _id = this.entity()._id;
    const agents = this.agents();
    return agents.filter(a => a.roles[_id].includes('RIGHTS_OWNER'));
  });
  contactPersons = computed(() => {
    const _id = this.entity()._id;
    const agents = this.agents();
    return agents.filter(a => a.roles[_id].includes('CONTACT_PERSON'));
  });
  customRoleAgents = computed(() => {
    const _id = this.entity()._id;
    const agents = this.agents();
    const customRoles = agents.flatMap(a =>
      a.roles[_id].filter(role => !DEFAULT_ROLE_TYPES.includes(role)),
    );
    const uniqueCustomRoles = Array.from(new Set(customRoles));
    return uniqueCustomRoles.map(role => ({
      role,
      label: formatRoleLabel(role),
      agents: agents.filter(a => a.roles[_id].includes(role)),
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
    const entityId = this.entity()._id;
    this.agents.update(agents => {
      const clone = [...agents];
      const currentAgent = clone.find(a => a._id == agent._id);
      if (!currentAgent) return clone;

      const roleIndex = currentAgent.roles[entityId].indexOf(role);
      if (roleIndex > -1) currentAgent.roles[entityId].splice(roleIndex, 1);

      if (currentAgent.roles[entityId].length === 0) {
        delete currentAgent.roles[entityId];
        const agentIndex = clone.indexOf(currentAgent);
        if (agentIndex > -1) clone.splice(agentIndex, 1);
      }

      return clone;
    });
  }
}
