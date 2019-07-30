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

  public objectID;
  public object;
  public downloadJsonHref: any;
  public viewerUrl: string;

  constructor(private route: ActivatedRoute,
              public mongo: MongoHandlerService,
              private sanitizer: DomSanitizer) {
    this.viewerUrl = `${environment.kompakkt_url}?model=${this.objectID}`;
  }

  public generateDownloadJsonUri() {
    const object = JSON.stringify(this.object, undefined, ' ');
    this.downloadJsonHref = this.sanitizer
      .bypassSecurityTrustUrl(`data:text/json;charset=UTF-8,${encodeURIComponent(object)}`);
  }

  ngOnInit() {

    this.objectID = this.route.snapshot.paramMap.get('id');

    this.mongo.getModel(this.objectID)
      .then(resultModel => {
        if (resultModel.status !== 'ok') throw new Error('Cannot get object');
        if (!resultModel.relatedDigitalObject) throw new Error('Invalid object metadata');
        return this.mongo.getModelMetadata(resultModel.relatedDigitalObject._id);
      })
      .then(result => {
        this.object = result;
        console.log(result);
      })
      .catch(e => {
        console.error(e);
      });
  }

}
