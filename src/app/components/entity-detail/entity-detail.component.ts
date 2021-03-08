import { Component, AfterViewInit, Input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import {
  isDigitalEntity,
  isEntity,
  IEntity,
  IMetaDataDigitalEntity,
  IMetaDataInstitution,
  IMetaDataPerson,
  IMetaDataPhysicalEntity,
} from '@kompakkt/shared';
import { AccountService } from '../../services/account.service';
import { DetailPageHelperService } from '../../services/detail-page-helper.service';

interface ILicence {
  src: string;
  description: string;
  link: string;
}

@Component({
  selector: 'app-entity-detail',
  templateUrl: './entity-detail.component.html',
  styleUrls: ['./entity-detail.component.scss'],
})
export class EntityDetailComponent implements AfterViewInit {
  public downloadJsonHref: any;
  @Input()
  public entity: IEntity | undefined;

  public roleStrings: { [key: string]: string } = {
    RIGHTS_OWNER: 'Rights Owner',
    CREATOR: 'Creator',
    EDITOR: 'Editor',
    DATA_CREATOR: 'Data Creator',
    CONTACT_PERSON: 'Contact Person',
  };

  public Licenses: { [key: string]: ILicence } = {
    BY: {
      src: 'assets/licence/BY.png',
      description: 'CC Attribution',
      link: 'https://creativecommons.org/licenses/by/4.0',
    },
    'BY-SA': {
      src: 'assets/licence/BY-SA.png',
      description: 'CC Attribution-ShareAlike',
      link: 'https://creativecommons.org/licenses/by-sa/4.0',
    },
    'BY-ND': {
      src: 'assets/licence/BY-ND.png',
      description: 'CC Attribution-NoDerivatives',
      link: 'https://creativecommons.org/licenses/by-nd/4.0',
    },
    BYNC: {
      src: 'assets/licence/BYNC.png',
      description: 'CC Attribution-NonCommercial',
      link: 'https://creativecommons.org/licenses/by-nc/4.0',
    },
    BYNCSA: {
      src: 'assets/licence/BYNCSA.png',
      description: 'CC Attribution-NonCommercial-ShareAlike',
      link: 'https://creativecommons.org/licenses/by-nc-sa/4.0',
    },
    BYNCND: {
      src: 'assets/licence/BYNCND.png',
      description: 'CC Attribution-NonCommercial-NoDerivatives',
      link: 'https://creativecommons.org/licenses/by-nc-nd/4.0',
    },
  };

  constructor(
    public account: AccountService,
    private sanitizer: DomSanitizer,
    private detailPageHelper: DetailPageHelperService,
  ) {}

  get annotationCount() {
    if (!this.entity) return 0;
    return Object.keys(this.entity.annotations).length;
  }

  get metadata() {
    if (!this.entity || !isEntity(this.entity)) return undefined;
    const metadata = this.entity.relatedDigitalEntity;
    if (!isDigitalEntity(metadata)) return undefined;
    return metadata;
  }

  public embed = () => {
    const iframe = document.querySelector('iframe') as
      | HTMLIFrameElement
      | undefined;
    if (!iframe) return;
    this.detailPageHelper.copyEmbed(iframe.outerHTML);
  };

  public generateDownloadJsonUri() {
    const object = JSON.stringify(this.metadata, undefined, ' ');
    this.downloadJsonHref = this.sanitizer.bypassSecurityTrustUrl(
      `data:text/json;charset=UTF-8,${encodeURIComponent(object)}`,
    );
  }

  public getCreationDate = () =>
    this.entity ? this.detailPageHelper.getCreationDate(this.entity) : '';

  public getNumQualities = () =>
    this.entity ? this.detailPageHelper.getNumQualities(this.entity) : 1;

  public getQualitiesAndSizes = () =>
    this.entity ? this.detailPageHelper.getQualitiesAndSizes(this.entity) : '';

  public getEntityPersonByRole = (
    entity: Partial<IMetaDataDigitalEntity | IMetaDataPhysicalEntity>,
    role: string,
  ) =>
    entity?.persons?.filter(person =>
      this.getPersonRole(person).includes(role),
    ) ?? [];

  public copyID = () =>
    this.detailPageHelper.copyID(this.entity?._id.toString() ?? '');

  public getID = (
    obj: IEntity | IMetaDataDigitalEntity | IMetaDataPhysicalEntity,
  ) => obj._id.toString();

  public getPersonRole = (person: IMetaDataPerson) =>
    this.metadata ? person.roles[this.metadata._id.toString()] : [];

  public getContactRef(person: IMetaDataPerson) {
    if (!this.metadata) return undefined;
    const related = person.contact_references[this.metadata._id.toString()];
    const latest = Object.values(person.contact_references)
      .filter(ref => ref.mail !== '')
      .sort((a, b) => a.creation_date - b.creation_date);
    return related && related.mail !== ''
      ? related
      : latest.length > 0
      ? latest[0]
      : undefined;
  }

  public getAddress(inst: IMetaDataInstitution) {
    if (!this.metadata) return undefined;
    return inst.addresses[this.metadata._id.toString()]
      ? inst.addresses[this.metadata._id.toString()]
      : Object.keys(inst.addresses).length > 0
      ? inst.addresses[Object.keys(inst.addresses)[0]]
      : undefined;
  }

  public getEntityInstitutionByRole = (
    entity: Partial<IMetaDataDigitalEntity | IMetaDataPhysicalEntity>,
    role: string,
  ) =>
    entity?.institutions?.filter(inst =>
      inst.roles[`${entity?._id}`]?.includes(role),
    ) ?? [];

  ngAfterViewInit() {
    // Workaround for https://github.com/angular/components/issues/11478
    const interval = setInterval(
      () =>
        document
          .querySelectorAll('mat-tooltip-component')
          .forEach(item => item.remove()),
      50,
    );

    setTimeout(() => clearInterval(interval), 500);
  }
}
