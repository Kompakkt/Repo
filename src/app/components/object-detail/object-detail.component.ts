import {Component, OnInit} from '@angular/core';
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

  constructor(private route: ActivatedRoute,
              public mongo: MongoHandlerService) {
  }

  getKompakktUrl() {
    return `${environment.kompakkt_url}?model=${this.objectID}`;
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
