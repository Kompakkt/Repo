import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';

import {
  MatExpansionPanel,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle,
} from '@angular/material/expansion';
import { MatFormField, MatHint, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { TranslatePipe } from "../../../../pipes/translate.pipe";
import { AnyEntity, DigitalEntity, PhysicalEntity } from 'src/app/metadata';
import { AgentsComponent } from "../../agents/agents.component";
import { LinksComponent } from "../links/links.component";
import { BiblioRefComponent } from "../biblio-ref/biblio-ref.component";
import { GeneralComponent } from "../../general/general.component";
import { BehaviorSubject, filter, map, Observable } from 'rxjs';
import { AddressComponent } from "../../address/address.component";
import { AgentCardComponent } from "../../agents/agent-card/agent-card.component";
import { IPerson } from 'src/common/interfaces';
import { DetailPersonComponent } from "../../../entity-detail/detail-person/detail-person.component";
import { ExternalIdsComponent } from "../external-ids/external-ids.component";
import { MetadataFilesComponent } from "../metadata-files/metadata-files.component";
import { MetadataCommunicationService } from 'src/app/services/metadata-communication.service';

@Component({
  selector: 'app-phys-obj',
  standalone: true,
  imports: [
    CommonModule,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    MatFormField,
    MatInput,
    MatLabel,
    TranslatePipe,
    AgentsComponent,
    LinksComponent,
    BiblioRefComponent,
    ReactiveFormsModule,
    FormsModule,
    GeneralComponent,
    AddressComponent,
    ExternalIdsComponent,
    MetadataFilesComponent
],
  templateUrl: './phys-obj.component.html',
  styleUrl: './phys-obj.component.scss'
})
export class PhysObjComponent implements OnChanges {
    @Input() entity!: DigitalEntity;

    public physEntity;
    public entityId: string = '';
    public digitalEntityId: string = '';

    public personTest: IPerson | undefined = undefined;

    public entitySubject = new BehaviorSubject<AnyEntity | undefined>(undefined);

    constructor(private metaService: MetadataCommunicationService) {
      
    }

    ngOnChanges(changes: SimpleChanges): void {

      let currentPhysEntity = changes.entity.currentValue.phyObjs[0];

      if(!currentPhysEntity) {
        currentPhysEntity = new PhysicalEntity();
        this.entity.addPhysicalEntity(currentPhysEntity);
      } 

      this.entityId = currentPhysEntity._id.toString();

      this.physEntity = this.entity.phyObjs[0];

      this.metaService.updatePhysicalEntity(this.physEntity);
    }
}

