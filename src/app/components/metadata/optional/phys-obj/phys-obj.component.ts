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
import { BehaviorSubject, Observable } from 'rxjs';
import { AddressComponent } from "../../address/address.component";

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
    AddressComponent
],
  templateUrl: './phys-obj.component.html',
  styleUrl: './phys-obj.component.scss'
})
export class PhysObjComponent implements OnChanges {
    @Input() entity!: DigitalEntity;
    @Input() physicalEntityStream!: Observable<PhysicalEntity>;
    @Input() digitalEntityStream!: Observable<DigitalEntity>;

    @Input() entitySubject!: BehaviorSubject<AnyEntity | undefined>;

    public physEntity: PhysicalEntity = new PhysicalEntity();

    ngOnChanges(changes: SimpleChanges): void {

      // const currentEntity = this.entity.phyObjs[0];

      // if(!currentEntity) {
      //   this.entity.phyObjs.push(this.physEntity);
      // } else {
      //   this.physEntity = currentEntity;
      // }

      const currentPhysEntity = this.entity.phyObjs[0];

      if(!currentPhysEntity) this.entity.phyObjs.push(this.physEntity)

      this.physEntity = this.entity.phyObjs[0];

    }
}
