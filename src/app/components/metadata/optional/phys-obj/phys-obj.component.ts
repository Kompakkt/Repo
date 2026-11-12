import { Component, computed, effect, model, OnInit } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
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
import { IDigitalEntityResolved } from '@kompakkt/common';
import { emptyPhysicalEntity, isPhysicalEntityValid } from 'src/app/metadata';
import { form, FormField, required } from '@angular/forms/signals';

@Component({
  selector: 'app-phys-obj',
  imports: [
    FormField,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    TranslatePipe,
    AgentsComponent,
    LinksComponent,
    BiblioRefComponent,
    GeneralComponent,
    AddressComponent,
    ExternalIdsComponent,
    MetadataFilesComponent,
    OutlinedInputComponent,
    DimensionComponent,
  ],
  templateUrl: './phys-obj.component.html',
  styleUrl: './phys-obj.component.scss',
})
export class PhysObjComponent implements OnInit {
  digitalEntity = model.required<IDigitalEntityResolved>({ alias: 'entity' });

  physicalEntityModel = model(emptyPhysicalEntity());
  physicalEntityForm = form(this.physicalEntityModel, path => {
    required(path.place.name, { message: 'Place name is required' });
  });
  isNonEmptyAndValidOrIsEmpty = computed(() => {
    const {
      title,
      description,
      place: { name },
    } = this.physicalEntityForm().value();
    const touched = this.physicalEntityForm().touched();
    if (!touched) return true;
    const hasTitle = title.trim().length > 0;
    const hasDescription = description.trim().length > 0;
    const hasPlaceName = name.trim().length > 0;
    if (hasTitle && hasDescription && hasPlaceName) return true;
    if (hasTitle || hasDescription || hasPlaceName) return false;
    return false;
  });
  _formChangedEffectRef = effect(() => {
    const data = this.physicalEntityForm().value();
    this.digitalEntity.update(entity => ({
      ...entity,
      phyObjs: [{ ...data }],
    }));
  });

  ngOnInit() {
    const phyObj = this.digitalEntity().phyObjs.at(0);
    if (phyObj && isPhysicalEntityValid(phyObj, false)) {
      this.physicalEntityModel.update(() => phyObj);
      this.physicalEntityForm().markAsTouched();
    }
  }
}
