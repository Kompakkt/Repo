import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, filter, map } from 'rxjs';
import { AnyEntity, DigitalEntity, Institution, Person, PhysicalEntity } from 'src/app/metadata';
import { isDigitalEntity, isPerson, isPhysicalEntity } from 'src/common/typeguards';

import { AsyncPipe } from '@angular/common';
import { AgentCardComponent } from "../agent-card/agent-card.component";

@Component({
  selector: 'app-agent-list',
  standalone: true,
  imports: [
    AsyncPipe,
    AgentCardComponent,
    CommonModule
],
  templateUrl: './agent-list.component.html',
  styleUrl: './agent-list.component.scss'
})
export class AgentListComponent implements OnChanges {
  @Input() public entity;

  public entityId = '';

  public entitySubject = new BehaviorSubject<AnyEntity | undefined>(undefined);

  get entity$() {
    return this.entitySubject.pipe(
      filter(entity => !!entity),
      map(entity => entity as AnyEntity),
    );
  }

  get _id$() {
    return this.entity$.pipe(map(entity => entity._id.toString()));
  }

  get digitalEntity$() {
    return this.entitySubject.pipe(
      filter(entity => isDigitalEntity(entity)),
      map(entity => entity as DigitalEntity),
    );
  }

  get physicalEntity$() {
    return this.entitySubject.pipe(
      filter(entity => isPhysicalEntity(entity)),
      map(entity => entity as PhysicalEntity),
    );
  }

  get hasRightsOwner$() {
    return this.digitalEntity$.pipe(
      map(digitalEntity => DigitalEntity.hasRightsOwner(digitalEntity)),
    );
  }

  get hasContactPerson$() {
    return this.digitalEntity$.pipe(
      map(digitalEntity => DigitalEntity.hasContactPerson(digitalEntity)),
    );
  }

  get hasCreator$() {
    return this.digitalEntity$.pipe(map(digitalEntity => DigitalEntity.hasCreator(digitalEntity)));
  }

  // get rightsOwnerList$() {
  //   return this.digitalEntity$.pipe(
  //     map(digitalEntity => DigitalEntity.rightsOwnerList(digitalEntity)),
  //   );
  // }

  get rightsOwnerList$() {
    if(isDigitalEntity(this.entity)) {
      return this.entity$.pipe(
        map(digitalEntity => DigitalEntity.rightsOwnerList(digitalEntity)),
      );
    } else {
      return this.entity$.pipe(
        map(physicalEntity => PhysicalEntity.rightsOwnerList(physicalEntity)),
      );
    }
  }

  get contactPersonList$() {
    if(isDigitalEntity(this.entity)) {
      return this.entity$.pipe(
        map(digitalEntity => DigitalEntity.contactPersonList(digitalEntity)),
      );
    } else {
      return this.entity$.pipe(
        map(physicalEntity => PhysicalEntity.contactPersonList(physicalEntity)),
      );
    }
  }

  get creatorList$() {
    if(isDigitalEntity(this.entity)) {
      return this.entity$.pipe(
        map(digitalEntity => DigitalEntity.creatorList(digitalEntity)),
      );
    } else {
      return this.entity$.pipe(
        map(physicalEntity => PhysicalEntity.creatorList(physicalEntity)),
      );
    }
  }

  get editorList$() {
    if(isDigitalEntity(this.entity)) {
      return this.entity$.pipe(
        map(digitalEntity => DigitalEntity.editorList(digitalEntity)),
      );
    } else {
      return this.entity$.pipe(
        map(physicalEntity => PhysicalEntity.editorList(physicalEntity)),
      );
    }
  }

  get dataCreatorList$() {
    if(isDigitalEntity(this.entity)) {
      return this.entity$.pipe(
        map(digitalEntity => DigitalEntity.dataCreatorList(digitalEntity)),
      );
    } else {
      return this.entity$.pipe(
        map(physicalEntity => PhysicalEntity.dataCreatorList(physicalEntity)),
      );
    }
  }

  isPerson(agent: Person | Institution): agent is Person {
    return (agent as Person).fullName !== undefined;
  }

  isInstitution(agent: Person | Institution): agent is Institution {
    return (agent as Institution).addresses !== undefined;
  }

  onDeleteAgentRole() {

  }

  removeAgentRole(agentType: string, role: string, agentId: string ) {
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
