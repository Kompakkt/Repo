import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, output, Pipe, PipeTransform } from '@angular/core';
import { MatButtonModule, MatIconButton } from '@angular/material/button';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { Institution, Person } from 'src/app/metadata';
import { MetadataCommunicationService } from 'src/app/services/metadata-communication.service';

@Pipe({
  name: 'isPerson',
  standalone: true,
})
export class IsPersonPipe implements PipeTransform {
  transform(agent: Person | Institution): agent is Person {
    return agent instanceof Person;
  }
}

@Component({
  selector: 'app-agent-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, IsPersonPipe],
  templateUrl: './agent-card.component.html',
  styleUrl: './agent-card.component.scss',
})
export class AgentCardComponent {
  #metaDataCommunicationService = inject(MetadataCommunicationService);

  agent = input.required<Person | Institution>();
  entityId = input.required<string>();
  remove = output<void>();

  contactReference = computed(() => {
    const agent = this.agent();
    const entityId = this.entityId();
    return agent instanceof Person ? agent.contact_references[entityId] : undefined;
  });

  address = computed(() => {
    const agent = this.agent();
    const entityId = this.entityId();
    return agent instanceof Institution ? agent.addresses[entityId] : undefined;
  });

  onSelectAgent() {
    this.#metaDataCommunicationService.selectAgent({
      agent: this.agent(),
      entityId: this.entityId(),
    });
  }
}
