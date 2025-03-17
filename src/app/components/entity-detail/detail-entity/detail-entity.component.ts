import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
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

interface ILicence {
  src: string;
  description: string;
  link: string;
}

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
    TranslatePipe,
    CommonModule,
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
    return isDigitalEntity(this.entity()) ? (this.entity() as IDigitalEntity) : undefined;
  });

  physicalEntity = computed(() => {
    return isPhysicalEntity(this.entity()) ? (this.entity() as IPhysicalEntity) : undefined;
  });

  place = computed(() => {
    return this.physicalEntity()?.place;
  });

  address = computed(() => {
    const address = this.place()?.address;
    if (!address) return undefined;
    return isAddress(address) ? address : undefined;
  });

  public Licenses: { [key: string]: ILicence } = {
    'CC0': {
      src: 'assets/licence/CC0.png',
      description: 'No Rights Reserved (CC0)',
      link: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
    'PDM': {
      src: 'assets/licence/PDM.png',
      description: 'Public Domain Mark 1.0 Universal (PDM 1.0)',
      link: 'https://creativecommons.org/publicdomain/mark/1.0/',
    },
    'BY': {
      src: 'assets/licence/BY.png',
      description: 'Attribution 4.0 International (CC BY 4.0)',
      link: 'https://creativecommons.org/licenses/by/4.0',
    },
    'BY-SA': {
      src: 'assets/licence/BY-SA.png',
      description: 'Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)',
      link: 'https://creativecommons.org/licenses/by-sa/4.0',
    },
    'BY-ND': {
      src: 'assets/licence/BY-ND.png',
      description: 'Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0)',
      link: 'https://creativecommons.org/licenses/by-nd/4.0',
    },
    'BYNC': {
      src: 'assets/licence/BYNC.png',
      description: 'Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)',
      link: 'https://creativecommons.org/licenses/by-nc/4.0',
    },
    'BYNCSA': {
      src: 'assets/licence/BYNCSA.png',
      description: 'Attribution-NonCommercial-ShareAlike International (CC BY-NC-SA 4.0)',
      link: 'https://creativecommons.org/licenses/by-nc-sa/4.0',
    },
    'BYNCND': {
      src: 'assets/licence/BYNCND.png',
      description: 'Attribution-NonCommercial-NoDerivatives 4.0 International (CC BY-NC-ND 4.0)',
      link: 'https://creativecommons.org/licenses/by-nc-nd/4.0',
    },
    'AR': {
      src: 'assets/licence/AR.png',
      description: 'All rights reserved',
      link: 'https://en.wikipedia.org/wiki/All_rights_reserved',
    },
  };
}
