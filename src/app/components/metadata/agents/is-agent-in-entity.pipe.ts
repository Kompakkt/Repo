import { Pipe, PipeTransform } from '@angular/core';
import { isInstitution, isPerson } from '@kompakkt/common';
import { AnyEntity, Institution, Person } from 'src/app/metadata';

@Pipe({ name: 'isAgentInEntity' })
export class IsAgentInEntityPipe implements PipeTransform {
  transform(value: AnyEntity, agent: Person | Institution): boolean {
    if (isPerson(agent)) {
      return value.persons.some(p => p._id === agent._id);
    } else if (isInstitution(agent)) {
      return value.institutions.some(i => i._id === agent._id);
    }
    return false;
  }
}
