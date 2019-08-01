import {Component, OnInit} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';
import {ActivatedRoute} from '@angular/router';

import {environment} from '../../../environments/environment';
import {MongoHandlerService} from '../../services/mongo-handler.service';

@Component({
  selector: 'app-object-detail',
  templateUrl: './object-detail.component.html',
  styleUrls: ['./object-detail.component.scss'],
})
export class ObjectDetailComponent implements OnInit {

  public object;
  public objectID;
  public objectReady: boolean;
  public downloadJsonHref: any;
  public viewerUrl: string;
  public viewer: {
    width: string;
    height: string;
  };

  constructor(private route: ActivatedRoute,
              public mongo: MongoHandlerService,
              private sanitizer: DomSanitizer) {
    this.viewerUrl = `${environment.kompakkt_url}?model=${this.objectID}`;
    this.objectReady = false;
    this.viewer = {
      width: '100%',
      height: '350px',
    };
  }

  public toggleViewer() {
    this.viewer.width = (this.viewer.width === '100%') ? '50px' : '100%';
  }

  public generateDownloadJsonUri() {
    const object = JSON.stringify(this.object, undefined, ' ');
    this.downloadJsonHref = this.sanitizer
      .bypassSecurityTrustUrl(`data:text/json;charset=UTF-8,${encodeURIComponent(object)}`);
  }

  ngOnInit() {

    this.objectID = this.route.snapshot.paramMap.get('id');

    this.mongo.getEntity(this.objectID)
      .then(resultEntity => {
        if (resultEntity.status !== 'ok') throw new Error('Cannot get object');
        if (!resultEntity.relatedDigitalEntity) throw new Error('Invalid object metadata');
        return this.mongo.getEntityMetadata(resultEntity.relatedDigitalEntity._id);
      })
      .then(result => {
        this.object = result;
        this.objectReady = true;
      })
      .catch(e => {
        console.error(e);
      });
  }

}
