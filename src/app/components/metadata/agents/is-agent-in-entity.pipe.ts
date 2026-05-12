import { Pipe, PipeTransform } from '@angular/core';
import { isInstitution, isPerson } from '@kompakkt/common';
import { AnyEntity, Institution, Person } from 'src/app/metadata';

@Pipe({ name: 'isAgentInEntity' })
export class IsAgentInEntityPipe implements PipeTransform {
  transform(value: AnyEntity, agent: Person | Institution, entityId: string): boolean {
    if (isPerson(agent)) {
      return value.persons.some(
        p =>
          p.contact_references[entityId]?.mail === agent.contact_references[entityId]?.mail &&
          p.fullName === agent.fullName,
      );
    } else if (isInstitution(agent)) {
      return value.institutions.some(
        i =>
          i.name === agent.name &&
          i.addresses[entityId]?.street === agent.addresses[entityId]?.street &&
          i.addresses[entityId]?.number === agent.addresses[entityId]?.number,
      );
    }
    return false;
  }
}
