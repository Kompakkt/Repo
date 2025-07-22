import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DigitalEntity, PhysicalEntity } from 'src/app/metadata';
import { MetadataCommunicationService } from 'src/app/services/metadata-communication.service';
import { TranslatePipe } from '../../../../pipes/translate.pipe';
import { AddressComponent } from '../../address/address.component';
import { AgentsComponent } from '../../agents/agents.component';
import { GeneralComponent } from '../../general/general.component';
import { BiblioRefComponent } from '../biblio-ref/biblio-ref.component';
import { ExternalIdsComponent } from '../external-ids/external-ids.component';
import { LinksComponent } from '../links/links.component';
import { MetadataFilesComponent } from '../metadata-files/metadata-files.component';
import { OtherComponent } from '../other/other.component';

@Component({
  selector: 'app-phys-obj',
  standalone: true,
  imports: [
    CommonModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    TranslatePipe,
    AgentsComponent,
    LinksComponent,
    BiblioRefComponent,
    ReactiveFormsModule,
    FormsModule,
    GeneralComponent,
    AddressComponent,
    ExternalIdsComponent,
    MetadataFilesComponent,
    OtherComponent,
  ],
  templateUrl: './phys-obj.component.html',
  styleUrl: './phys-obj.component.scss',
})
export class PhysObjComponent {
  #metaService = inject(MetadataCommunicationService);

  entity = input.required<DigitalEntity>();
  physEntity = computed(() => {
    const existing = this.entity().phyObjs.at(0);
    if (!existing) {
      const newEntity = new PhysicalEntity();
      this.entity().addPhysicalEntity(newEntity);
      return newEntity;
    } else {
      return existing;
    }
  });
  updatePhysEntityEffect = effect(() => {
    const physEntity = this.physEntity();
    if (physEntity) {
      this.#metaService.updatePhysicalEntity(physEntity);
    }
  });
}
