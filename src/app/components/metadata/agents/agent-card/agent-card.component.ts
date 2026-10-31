import { Component, computed, input, output, Pipe, PipeTransform } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { IInstitutionResolved, IPersonResolved, isInstitution, isPerson } from '@kompakkt/common';

@Pipe({ name: 'isPerson' })
export class IsPersonPipe implements PipeTransform {
  transform(agent: IPersonResolved | IInstitutionResolved): agent is IPersonResolved {
    return isPerson(agent);
  }
}

@Component({
  selector: 'app-agent-card',
  imports: [MatIconModule, MatButtonModule, IsPersonPipe],
  templateUrl: './agent-card.component.html',
  styleUrl: './agent-card.component.scss',
})
export class AgentCardComponent {
  agent = input.required<IPersonResolved | IInstitutionResolved>();
  entityId = input.required<string>();

  remove = output<void>();
  select = output<void>();

  contactReference = computed(() => {
    const agent = this.agent();
    const entityId = this.entityId();
    return isPerson(agent) ? agent.contact_references[entityId] : undefined;
  });

  address = computed(() => {
    const agent = this.agent();
    const entityId = this.entityId();
    return isInstitution(agent) ? agent.addresses[entityId] : undefined;
  });
}
