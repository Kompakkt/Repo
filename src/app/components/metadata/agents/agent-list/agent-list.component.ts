import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, filter, map } from 'rxjs';
import { AnyEntity, DigitalEntity, Institution, Person, PhysicalEntity } from 'src/app/metadata';
import { isDigitalEntity, isPerson, isPhysicalEntity } from 'src/common/typeguards';

import { AsyncPipe } from '@angular/common';
import { AgentCardComponent } from '../agent-card/agent-card.component';

@Component({
  selector: 'app-agent-list',
  standalone: true,
  imports: [AsyncPipe, AgentCardComponent, CommonModule],
  templateUrl: './agent-list.component.html',
  styleUrl: './agent-list.component.scss',
})
export class AgentListComponent implements OnChanges {
  @Input() public entity!: AnyEntity;

  public entityId = '';
  public entitySubject = new BehaviorSubject<AnyEntity | undefined>(undefined);

  entity$ = this.entitySubject.pipe(
    filter(entity => !!entity),
    map(entity => entity as AnyEntity),
  );

  _id$ = this.entity$.pipe(map(entity => entity._id.toString()));

  digitalEntity$ = this.entitySubject.pipe(
    filter(entity => isDigitalEntity(entity)),
    map(entity => entity as DigitalEntity),
  );

  physicalEntity$ = this.entitySubject.pipe(
    filter(entity => isPhysicalEntity(entity)),
    map(entity => entity as PhysicalEntity),
  );

  hasRightsOwner$ = this.digitalEntity$.pipe(
    map(digitalEntity => DigitalEntity.hasRightsOwner(digitalEntity)),
  );

  hasContactPerson$ = this.digitalEntity$.pipe(
    map(digitalEntity => DigitalEntity.hasContactPerson(digitalEntity)),
  );

  hasCreator$ = this.digitalEntity$.pipe(
    map(digitalEntity => DigitalEntity.hasCreator(digitalEntity)),
  );

  rightsOwnerList$ = this.entity$.pipe(
    map(entity => {
      if (isDigitalEntity(entity)) {
        return DigitalEntity.rightsOwnerList(entity);
      } else {
        return PhysicalEntity.rightsOwnerList(entity);
      }
    }),
  );

  contactPersonList$ = this.entity$.pipe(
    map(entity => {
      if (isDigitalEntity(entity)) {
        return DigitalEntity.contactPersonList(entity);
      } else {
        return PhysicalEntity.contactPersonList(entity);
      }
    }),
  );

  creatorList$ = this.entity$.pipe(
    map(entity => {
      if (isDigitalEntity(entity)) {
        return DigitalEntity.creatorList(entity);
      } else {
        return PhysicalEntity.creatorList(entity);
      }
    }),
  );

  editorList$ = this.entity$.pipe(
    map(entity => {
      if (isDigitalEntity(entity)) {
        return DigitalEntity.editorList(entity);
      } else {
        return PhysicalEntity.editorList(entity);
      }
    }),
  );

  dataCreatorList$ = this.entity$.pipe(
    map(entity => {
      if (isDigitalEntity(entity)) {
        return DigitalEntity.dataCreatorList(entity);
      } else {
        return PhysicalEntity.dataCreatorList(entity);
      }
    }),
  );

  isPerson(agent: Person | Institution): agent is Person {
    return (agent as Person).fullName !== undefined;
  }

  isInstitution(agent: Person | Institution): agent is Institution {
    return (agent as Institution).addresses !== undefined;
  }

  onDeleteAgentRole() {}

  removeAgentRole(agentType: string, role: string, agentId: string) {
    // console.log('agentType =>', agentType);
    // console.log('Role => ', role);
    // console.log('agentId =>', agentId);

    if (Array.isArray(this.entity[agentType])) {
      const currentAgent = this.entity[agentType].find(agent => agent._id == agentId);
      const roleIndex = currentAgent.roles[this.entityId].indexOf(role);
      if (roleIndex > -1) {
        currentAgent.roles[this.entityId].splice(roleIndex, 1);
      }

      if (currentAgent.roles[this.entityId].length == 0) {
        const agentIndex = this.entity[agentType].indexOf(currentAgent);
        this.entity[agentType].splice(agentIndex, 1)[0];
      }
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    const digitalEntity = changes.entity?.currentValue as DigitalEntity | undefined;

    const physicalEntity = changes.entity?.currentValue as PhysicalEntity | undefined;

    console.log(digitalEntity, physicalEntity);

    if (digitalEntity) this.entitySubject.next(digitalEntity);

    if (physicalEntity) this.entitySubject.next(physicalEntity);

    if (!digitalEntity && !physicalEntity) this.entitySubject.next(new DigitalEntity());

    this.entityId = this.entity._id.toString();
  }
}
