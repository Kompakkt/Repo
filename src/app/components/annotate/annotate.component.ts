import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { environment } from '../../../environments/environment';
import { MongoHandlerService } from '../../services/mongo-handler.service';

@Component({
  selector: 'app-annotate',
  templateUrl: './annotate.component.html',
  styleUrls: ['./annotate.component.scss'],
})
export class AnnotateComponent implements OnInit {
  public object;
  public objectID;
  public viewerUrl: string;
  public objectReady: boolean;

  constructor(
    private route: ActivatedRoute,
    public mongo: MongoHandlerService,
  ) {
    this.viewerUrl = ``;
    this.objectReady = false;
  }

  ngOnInit() {
    this.objectID = this.route.snapshot.paramMap.get('id');

    if (!this.objectID) {
      this.viewerUrl = `${environment.kompakkt_url}?mode=annotation`;
    } else {
      this.objectReady = true;

      this.mongo
        .getEntity(this.objectID)
        .then(resultEntity => {
          if (resultEntity.status !== 'ok') {
            this.objectReady = false;
            throw new Error('Cannot get object.');
          }
          if (!resultEntity.relatedDigitalEntity) {
            throw new Error('Invalid object metadata.');
          }
          return this.mongo.getEntityMetadata(
            resultEntity.relatedDigitalEntity._id,
          );
        })
        .then(result => {
          this.object = result;
          this.objectReady = true;
        })
        .catch(e => {
          this.objectReady = false;
          console.error(e);
        });
    }
  }
}
