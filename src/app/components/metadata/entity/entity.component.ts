import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, computed, signal, ChangeDetectionStrategy, inject, model } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatRadioModule } from '@angular/material/radio';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  AnyEntity,
  cloneEntity,
  CreationTuple,
  DescriptionValueTuple,
  DigitalEntity,
  DimensionTuple,
  FileTuple,
  Institution,
  Person,
  PhysicalEntity,
  PlaceTuple,
  Tag,
  TypeValueTuple,
} from 'src/app/metadata';
import { isFreeLicence } from 'src/app/metadata/licences';
import { ContentProviderService, SnackbarService } from 'src/app/services';
import { isDigitalEntity, isPhysicalEntity } from '@kompakkt/common';
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
  public content = inject(ContentProviderService);
  public dialog = inject(MatDialog);

  entity = model.required<AnyEntity>();
  digitalEntity = computed(() =>
    isDigitalEntity(this.entity()) ? (this.entity() as DigitalEntity) : new DigitalEntity(),
  );
  physicalEntity = computed(() =>
    isPhysicalEntity(this.entity()) ? (this.entity() as PhysicalEntity) : new PhysicalEntity(),
  );

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

  // Public for validation
  public PhysicalEntity = PhysicalEntity;
  public DimensionTuple = DimensionTuple;
  public PlaceTuple = PlaceTuple;
  public CreationTuple = CreationTuple;
  public TypeValueTuple = TypeValueTuple;
  public DescriptionValueTuple = DescriptionValueTuple;
  public Person = Person;
  public Institution = Institution;
  public Tag = Tag;
  public FileTuple = FileTuple;

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
    const digitalEntity = this.digitalEntity();
    return (
      !!digitalEntity?.licence &&
      (!isFreeLicence(digitalEntity.licence) ? !!digitalEntity.licenceAttribution?.trim() : true)
    );
  }

  get placeValid() {
    const physicalEntity = this.physicalEntity();
    return physicalEntity ? PlaceTuple.checkIsValid(physicalEntity.place) : false;
  }

  get hasRightsOwner() {
    const digitalEntity = this.digitalEntity();
    return digitalEntity?.hasRightsOwner();
  }

  get hasContactPerson() {
    const digitalEntity = this.digitalEntity();
    return digitalEntity?.hasContactPerson();
  }

  get personsValid() {
    const entity = this.entity();
    return undefined === entity.persons.find(p => !Person.checkIsValid(p, entity._id.toString()));
  }

  get institutionsValid() {
    const entity = this.entity();
    return (
      undefined ===
      entity.institutions.find(i => !Institution.checkIsValid(i, entity._id.toString()))
    );
  }

  get dimensionsValid() {
    const entity = this.digitalEntity();
    return entity
      ? undefined === entity.dimensions.find(d => !DimensionTuple.checkIsValid(d))
      : false;
  }

  get creationValid() {
    const entity = this.digitalEntity();
    return entity ? undefined === entity.creation.find(c => !CreationTuple.checkIsValid(c)) : false;
  }

  get externalIdValid() {
    const entity = this.entity();
    return undefined === entity.externalId.find(c => !TypeValueTuple.checkIsValid(c));
  }

  get externalLinkValid() {
    const entity = this.entity();
    return undefined === entity.externalLink.find(c => !DescriptionValueTuple.checkIsValid(c));
  }

  get biblioRefsValid() {
    const entity = this.entity();
    return undefined === entity.biblioRefs.find(c => !DescriptionValueTuple.checkIsValid(c, false));
  }

  get metadataFilesValid() {
    const entity = this.entity();
    return undefined === entity.metadata_files.find(c => !FileTuple.checkIsValid(c));
  }

  get phyObjsValid() {
    const entity = this.digitalEntity();
    return entity ? undefined === entity.phyObjs.find(p => !PhysicalEntity.checkIsValid(p)) : false;
  }
  // /Validation

  public removeValueFromProperty(entity: AnyEntity, data: any) {
    const { property, index } = data;
    this.entity.update(entity => {
      const clone = cloneEntity(entity);
      if (Array.isArray(clone[property])) {
        const arr = [...clone[property]];
        arr[property].splice(index, 1);
        clone[property] = arr;
      }
      return clone;
    })
  }
}
