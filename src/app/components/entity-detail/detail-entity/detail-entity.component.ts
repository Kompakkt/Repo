
import { Component, computed, input } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { Licences } from 'src/app/metadata/licences';
import {
  IAddress,
  IDigitalEntity,
  IPhysicalEntity,
  isDigitalEntity,
  isInstitution,
  isPerson,
  isPhysicalEntity,
} from 'src/common';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { DetailInstitutionComponent } from '../detail-institution/detail-institution.component';
import { DetailPersonComponent } from '../detail-person/detail-person.component';

type AnyEntity = IDigitalEntity | IPhysicalEntity;

// TODO: Kompakkt/Common typeguard
const isAddress = (obj: IAddress): obj is IAddress => {
  return (
    !!obj?.building ||
    !!obj?.city ||
    !!obj?.country ||
    !!obj?.number ||
    !!obj?.street ||
    !!obj?.postcode
  );
};

@Component({
  selector: 'app-detail-entity',
  templateUrl: './detail-entity.component.html',
  styleUrls: ['./detail-entity.component.scss'],
  imports: [
    MatExpansionModule,
    DetailPersonComponent,
    DetailInstitutionComponent,
    TranslatePipe
],
})
export class DetailEntityComponent {
  public entity = input.required<IDigitalEntity | IPhysicalEntity>();

  metadataFiles = computed(() => {
    const entity = this.entity();
    return entity.metadata_files;
  });

  hasMetadataFiles = computed(() => {
    return this.metadataFiles().length > 0;
  });

  otherMetadata = computed(() => {
    const entity = this.entity();
    return entity.other;
  });

  hasOtherMetadata = computed(() => {
    return this.otherMetadata().length > 0;
  });

  bibRefs = computed(() => {
    const entity = this.entity();
    return entity.biblioRefs;
  });

  hasBibRefs = computed(() => {
    return this.bibRefs().length > 0;
  });

  externalLinks = computed(() => {
    const entity = this.entity();
    return entity.externalLink;
  });

  hasExternalLinks = computed(() => {
    return this.externalLinks().length > 0;
  });

  externalIds = computed(() => {
    const entity = this.entity();
    return entity.externalId;
  });

  hasExternalIds = computed(() => {
    return this.externalIds().length > 0;
  });

  persons = computed(() => {
    return this.entity().persons.filter(p => isPerson(p));
  });

  institutions = computed(() => {
    return this.entity().institutions.filter(i => isInstitution(i));
  });

  hasPersonsOrInstitutions = computed(() => {
    return this.persons().length + this.institutions().length > 0;
  });

  digitalEntity = computed(() => {
    const entity = this.entity();
    return isDigitalEntity(entity) ? (entity as IDigitalEntity) : undefined;
  });

  physicalEntity = computed(() => {
    const entity = this.entity();
    return isPhysicalEntity(entity) ? (entity as IPhysicalEntity) : undefined;
  });

  place = computed(() => {
    return this.physicalEntity()?.place;
  });

  address = computed(() => {
    const address = this.place()?.address;
    if (!address) return undefined;
    return isAddress(address) ? address : undefined;
  });

  public Licenses = Licences;
}
