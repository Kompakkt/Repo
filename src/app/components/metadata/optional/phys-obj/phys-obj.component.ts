import {
  Component,
  computed,
  effect,
  inject,
  input,
  ChangeDetectionStrategy,
  model,
} from '@angular/core';
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
import { OutlinedInputComponent } from '../../../outlined-input/outlined-input.component';
import { DimensionComponent } from '../dimension/dimension.component';

@Component({
  selector: 'app-phys-obj',
  standalone: true,
  imports: [
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
    OutlinedInputComponent,
    DimensionComponent,
  ],
  templateUrl: './phys-obj.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './phys-obj.component.scss',
})
export class PhysObjComponent {
  #metaService = inject(MetadataCommunicationService);

  entity = model.required<PhysicalEntity>();

  updatePhysEntityEffect = effect(() => {
    const physEntity = this.entity();
    if (physEntity) {
      this.#metaService.physicalEntity.set(physEntity);
    }
  });
}
