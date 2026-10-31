import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, signal, ChangeDetectionStrategy, inject, model } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatRadioModule } from '@angular/material/radio';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  entityHasRole,
  isCreationTupleValid,
  isDescriptionValueTupleValid,
  isDimensionTupleValid,
  isFileTupleValid,
  isInstitutionValid,
  isPersonValid,
  isPhysicalEntityValid,
  isPlaceTupleValid,
  isTypeValueTupleValid,
  type AnyEntity,
} from 'src/app/metadata';
import { isFreeLicence } from 'src/app/metadata/licences';
import { IDigitalEntityResolved } from '@kompakkt/common';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { AgentsComponent } from '../agents/agents.component';
import { GeneralComponent } from '../general/general.component';
import { BiblioRefComponent } from '../optional/biblio-ref/biblio-ref.component';
import { CreationComponent } from '../optional/creation/creation.component';
import { ExternalIdsComponent } from '../optional/external-ids/external-ids.component';
import { LinksComponent } from '../optional/links/links.component';
import { MetadataFilesComponent } from '../optional/metadata-files/metadata-files.component';
import { PhysObjComponent } from '../optional/phys-obj/phys-obj.component';
import { MatExpansionModule } from '@angular/material/expansion';
import { LicenceComponent } from '../licence/licence.component';

@Component({
  selector: 'app-entity',
  templateUrl: './entity.component.html',
  styleUrls: ['./entity.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    MatIconModule,
    MatTooltipModule,
    MatRadioModule,
    MatSidenavModule,
    MatListModule,
    MatTabsModule,
    TranslatePipe,
    AgentsComponent,
    CreationComponent,
    LinksComponent,
    PhysObjComponent,
    GeneralComponent,
    ExternalIdsComponent,
    BiblioRefComponent,
    MetadataFilesComponent,
    MatExpansionModule,
    LicenceComponent,
  ],
})
export class EntityComponent {
  public dialog = inject(MatDialog);

  entity = model.required<IDigitalEntityResolved>();

  selectedTabIndex = 0;

  licenceKey = signal('');
  licenceAttribution = signal('');

  tabList = [
    'General',
    'Licence',
    'Related',
    'Creation',
    'Ids',
    'Links',
    'References',
    'Files',
    'Physical',
  ];

  public indexString = 'General';
  public separatorKeysCodes: number[] = [ENTER, COMMA];

  constructor() {
    (window as any)['printEntity'] = () => console.log(this.entity());
  }

  public selectTab(indexString: string) {
    this.selectedTabIndex = this.tabList.findIndex(tab => tab == indexString);
    this.indexString = indexString;
  }

  // Validation
  get generalInformationValid() {
    const entity = this.entity();
    return entity.title && entity.description;
  }

  get licenceValid() {
    const digitalEntity = this.entity();
    return (
      !!digitalEntity?.licence &&
      (!isFreeLicence(digitalEntity.licence) ? !!digitalEntity.licenceAttribution?.trim() : true)
    );
  }

  get placeValid() {
    const physicalEntity = this.entity().phyObjs.find(p => isPhysicalEntityValid(p));
    return physicalEntity ? isPlaceTupleValid(physicalEntity.place) : false;
  }

  get hasRightsOwner() {
    const digitalEntity = this.entity();
    return entityHasRole(digitalEntity, 'RIGHTS_OWNER');
  }

  get hasContactPerson() {
    const digitalEntity = this.entity();
    return entityHasRole(digitalEntity, 'CONTACT_PERSON');
  }

  get personsValid() {
    const entity = this.entity();
    return entity.persons.every(p => isPersonValid(p, entity._id.toString()));
  }

  get institutionsValid() {
    const entity = this.entity();
    return entity.institutions.every(i => isInstitutionValid(i, entity._id.toString()));
  }

  get dimensionsValid() {
    const entity = this.entity();
    return entity.dimensions.every(d => isDimensionTupleValid(d));
  }

  get creationValid() {
    const entity = this.entity();
    return entity.creation.every(c => isCreationTupleValid(c));
  }

  get externalIdValid() {
    const entity = this.entity();
    return entity.externalId.every(c => isTypeValueTupleValid(c));
  }

  get externalLinkValid() {
    const entity = this.entity();
    return entity.externalLink.every(c => isDescriptionValueTupleValid(c));
  }

  get biblioRefsValid() {
    const entity = this.entity();
    return entity.biblioRefs.every(c => isDescriptionValueTupleValid(c, false));
  }

  get metadataFilesValid() {
    const entity = this.entity();
    return entity.metadata_files.every(c => isFileTupleValid(c));
  }

  get phyObjsValid() {
    const entity = this.entity();
    return entity.phyObjs.every(p => isPhysicalEntityValid(p));
  }
  // /Validation

  public removeValueFromProperty({ property, index }: { property: string; index: number }) {
    this.entity.update(entity => {
      const clone = structuredClone(entity);
      if (Array.isArray(clone[property])) {
        const arr = [...clone[property]];
        arr.splice(index, 1);
        clone[property] = arr;
      }
      return clone;
    });
  }
}
