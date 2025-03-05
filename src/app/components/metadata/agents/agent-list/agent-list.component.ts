import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, filter, map, Observable, of, Subscription } from 'rxjs';
import { AnyEntity, DigitalEntity, Institution, Person, PhysicalEntity } from 'src/app/metadata';
import { isDigitalEntity, isPerson, isPhysicalEntity } from 'src/common/typeguards';

import { AsyncPipe } from '@angular/common';
import { AgentCardComponent } from '../agent-card/agent-card.component';
import { MetadataCommunicationService } from 'src/app/services/metadata-communication.service';

@Component({
  selector: 'app-agent-list',
  standalone: true,
  imports: [AsyncPipe, AgentCardComponent, CommonModule],
  templateUrl: './agent-list.component.html',
  styleUrl: './agent-list.component.scss',
})
export class AgentListComponent implements OnChanges, OnInit {
  @Input() public entity!: AnyEntity;

  public entityId = '';

  // entitySubscription!: Subscription;
  entity$!: Observable<AnyEntity | null>;

  digitalEntity$!: Observable<DigitalEntity>;
  physicalEntity$!: Observable<PhysicalEntity>;

  hasRightsOwner$!: Observable<boolean>;
  hasContactPerson$!: Observable<boolean>;
  hasCreator$!: Observable<boolean>;

  rightsOwnerList$!: Observable<(Person | Institution)[]>;
  contactPersonList$!: Observable<(Person | Institution)[]>;
  creatorList$!: Observable<(Person | Institution)[]>;
  editorList$!: Observable<(Person | Institution)[]>;
  dataCreatorList$!: Observable<(Person | Institution)[]>;

  constructor(private metaService: MetadataCommunicationService) {}

  isPerson(agent: Person | Institution): agent is Person {
    return (agent as Person).fullName !== undefined;
  }

  isInstitution(agent: Person | Institution): agent is Institution {
    return (agent as Institution).addresses !== undefined;
  }

  removeAgentRole(agentType: string, role: string, agentId: string) {
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

    this.metaService.setEntity(this.entity, this.entityId);
  }

  ngOnInit(): void {
    this.entity$ = this.metaService.getSelectedEntity$(this.entityId);

    this.digitalEntity$ = this.entity$.pipe(
      filter(entity => isDigitalEntity(entity)),
      map(entity => {
        console.log(entity);
        return entity as DigitalEntity
      }),
    );

    this.physicalEntity$ = this.entity$.pipe(
      filter(entity => isPhysicalEntity(entity)),
      map(entity => entity as PhysicalEntity),
    );

    this.hasRightsOwner$ = this.digitalEntity$.pipe(
      map(digitalEntity => DigitalEntity.hasRightsOwner(digitalEntity)),
    );

    this.hasContactPerson$ = this.digitalEntity$.pipe(
      map(digitalEntity => DigitalEntity.hasContactPerson(digitalEntity)),
    );

    this.hasCreator$ = this.digitalEntity$.pipe(
      map(digitalEntity => DigitalEntity.hasCreator(digitalEntity)),
    );

    this.rightsOwnerList$ = this.entity$.pipe(
      map(entity => {
        if (isDigitalEntity(entity)) {
          return DigitalEntity.rightsOwnerList(entity);
        } else {
          return PhysicalEntity.rightsOwnerList(entity as PhysicalEntity);
        }
      }),
    );

    this.contactPersonList$ = this.entity$.pipe(
      map(entity => {
        if (isDigitalEntity(entity)) {
          return DigitalEntity.contactPersonList(entity);
        } else {
          return PhysicalEntity.contactPersonList(entity as PhysicalEntity);
        }
      }),
    );

    this.creatorList$ = this.entity$.pipe(
      map(entity => {
        if (isDigitalEntity(entity)) {
          return DigitalEntity.creatorList(entity);
        } else {
          return PhysicalEntity.creatorList(entity as PhysicalEntity);
        }
      }),
    );

    this.editorList$ = this.entity$.pipe(
      map(entity => {
        if (isDigitalEntity(entity)) {
          return DigitalEntity.editorList(entity);
        } else {
          return PhysicalEntity.editorList(entity as PhysicalEntity);
        }
      }),
    );

    this.dataCreatorList$ = this.entity$.pipe(
      map(entity => {
        if (isDigitalEntity(entity)) {
          return DigitalEntity.dataCreatorList(entity);
        } else {
          return PhysicalEntity.dataCreatorList(entity as PhysicalEntity);
        }
      }),
    );
  }

  ngOnChanges(changes: SimpleChanges) {
    this.entityId = this.entity._id.toString();
  }
}
