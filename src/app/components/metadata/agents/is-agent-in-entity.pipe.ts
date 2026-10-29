import { Pipe, PipeTransform } from '@angular/core';
import { isInstitution, isPerson } from '@kompakkt/common';
import { AnyEntity, Institution, Person } from 'src/app/metadata';

export const isAgentInEntity = ({
  entity,
  agent,
  entityId,
}: {
  entity: AnyEntity;
  agent: Person | Institution;
  entityId: string;
}) => {
  if (isPerson(agent)) {
    return entity.persons.some(
      p =>
        p.contact_references[entityId]?.mail === agent.contact_references[entityId]?.mail &&
        p.fullName === agent.fullName,
    );
  } else if (isInstitution(agent)) {
    return entity.institutions.some(
      i =>
        i.name === agent.name &&
        i.addresses[entityId]?.street === agent.addresses[entityId]?.street &&
        i.addresses[entityId]?.number === agent.addresses[entityId]?.number,
    );
  }
  return false;
};

@Pipe({ name: 'isAgentInEntity' })
export class IsAgentInEntityPipe implements PipeTransform {
  transform(entity: AnyEntity, agent: Person | Institution, entityId: string): boolean {
    return isAgentInEntity({ entity, agent, entityId });
  }
}
