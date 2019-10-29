import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';

import { environment } from '../../../environments/environment';
import { EmbedEntityComponent } from '../../dialogs/embed-entity/embed-entity.component';
import {
  IMetaDataDigitalEntity,
  IMetaDataPhysicalEntity,
  IMetaDataPerson,
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
    entity.persons.filter(
      person =>
        person.roles[entity._id] && person.roles[entity._id].includes(role),
    );

  public getContactRef(person: IMetaDataPerson) {
    if (!this.object) return undefined;
    return person.contact_references[this.object._id]
      ? person.contact_references[this.object._id]
      : Object.keys(person.contact_references).length > 0
      ? person.contact_references[Object.keys(person.contact_references)[0]]
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
