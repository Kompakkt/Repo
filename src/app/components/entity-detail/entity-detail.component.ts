import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';

import { environment } from '../../../environments/environment';
import { EmbedEntityComponent } from '../../dialogs/embed-entity/embed-entity.component';
import {
  IMetaDataDigitalEntity,
  IMetaDataPhysicalEntity,
  IMetaDataPerson,
  IMetaDataInstitution,
} from '../../interfaces';
import { MongoHandlerService } from '../../services/mongo-handler.service';
import { AccountService } from '../../services/account.service';

@Component({
  selector: 'app-entity-detail',
  templateUrl: './entity-detail.component.html',
  styleUrls: ['./entity-detail.component.scss'],
})
export class EntityDetailComponent implements OnInit {
  public object: IMetaDataDigitalEntity | undefined;
  public objectID;
  public objectReady: boolean;
  public downloadJsonHref: any;
  public viewerUrl: string;

  public isAuthenticated = false;

  public roleStrings = {
    RIGHTS_OWNER: 'Rightsowner',
    CREATOR: 'Creator',
    EDITOR: 'Editor',
    DATA_CREATOR: 'Data Creator',
    CONTACT_PERSON: 'Contact Person',
  };

  public Licenses = {
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
    private account: AccountService,
    private route: ActivatedRoute,
    public mongo: MongoHandlerService,
    private sanitizer: DomSanitizer,
    private dialog: MatDialog,
  ) {
    this.viewerUrl = ``;
    this.objectReady = false;

    this.account.isUserAuthenticatedObservable.subscribe(
      state => (this.isAuthenticated = state),
    );
  }

  public embed() {
    this.dialog.open(EmbedEntityComponent, {
      data: this.objectID,
    });
  }

  public generateDownloadJsonUri() {
    const object = JSON.stringify(this.object, undefined, ' ');
    this.downloadJsonHref = this.sanitizer.bypassSecurityTrustUrl(
      `data:text/json;charset=UTF-8,${encodeURIComponent(object)}`,
    );
  }

  public getEntityPersonByRole = (
    entity: IMetaDataDigitalEntity | IMetaDataPhysicalEntity,
    role: string,
  ) =>
    entity.persons.filter(person => this.getPersonRole(person).includes(role));

  public getPersonRole = (person: IMetaDataPerson) =>
    this.object ? person.roles[this.object._id] : [];

  public getContactRef(person: IMetaDataPerson) {
    if (!this.object) return undefined;
    const related = person.contact_references[this.object._id];
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
    if (!this.object) return undefined;
    return inst.addresses[this.object._id]
      ? inst.addresses[this.object._id]
      : Object.keys(inst.addresses).length > 0
      ? inst.addresses[Object.keys(inst.addresses)[0]]
      : undefined;
  }

  public getEntityInstitutionByRole = (
    entity: IMetaDataDigitalEntity | IMetaDataPhysicalEntity,
    role: string,
  ) =>
    entity.institutions.filter(
      inst => inst.roles[entity._id] && inst.roles[entity._id].includes(role),
    );

  ngOnInit() {
    this.objectID = this.route.snapshot.paramMap.get('id');
    this.mongo
      .getEntity(this.objectID)
      .then(resultEntity => {
        if (resultEntity.status !== 'ok') throw new Error('Cannot get object');
        if (!resultEntity.relatedDigitalEntity) {
          throw new Error('Invalid object metadata');
        }
        return this.mongo.getEntityMetadata(
          resultEntity.relatedDigitalEntity._id,
        );
      })
      .then(result => {
        this.object = result;
        this.objectReady = true;
        this.viewerUrl = `${environment.kompakkt_url}?entity=${this.objectID}&mode=open`;
      })
      .catch(e => {
        this.viewerUrl = `${environment.kompakkt_url}?entity=${this.objectID}&mode=upload`;
        this.object = undefined;
        this.objectReady = true;
        console.error(e);
      });
  }
}
