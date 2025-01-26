import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle } from '@angular/material/expansion';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { TranslatePipe } from 'src/app/pipes';
import { AgentsComponent } from '../agents/agents.component';
import { BiblioRefComponent } from '../optional/biblio-ref/biblio-ref.component';
import { LinksComponent } from '../optional/links/links.component';
import { AnyEntity, DigitalEntity, PhysicalEntity } from 'src/app/metadata';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { isDigitalEntity } from 'src/common';
import { filter, map, Observable } from 'rxjs';

@Component({
  selector: 'app-general',
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
        FormsModule
  ],
  templateUrl: './general.component.html',
  styleUrl: './general.component.scss'
})
export class GeneralComponent implements OnChanges {

  @Input('entity')
  public entity!: PhysicalEntity | DigitalEntity;
  @Input() public physicalEntity!: PhysicalEntity;
  @Input() public digitalEntity!: DigitalEntity;

  @Input() physicalEntityStream!: Observable<PhysicalEntity>;
  @Input() digitalEntityStream!: Observable<DigitalEntity>;

  @Input() entitySubject!: BehaviorSubject<AnyEntity | undefined>;

  // public physicalEntity: PhysicalEntity | undefined;
  public isPhysicalEntity: boolean = false;

  ngOnChanges(changes: SimpleChanges): void {
    if(this.physicalEntity) {
      this.entity = this.physicalEntity;
    }
  }

}
