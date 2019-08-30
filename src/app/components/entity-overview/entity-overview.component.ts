import { Component, OnInit } from '@angular/core';

import { IEntity } from '../../interfaces';
import { MongoHandlerService } from '../../services/mongo-handler.service';

@Component({
  selector: 'app-entity-overview',
  templateUrl: './entity-overview.component.html',
  styleUrls: ['./entity-overview.component.scss'],
})
export class EntityOverviewComponent implements OnInit {
  public entities: IEntity[] = [];

  public icons = {
    audio: 'audiotrack',
    video: 'movie',
    image: 'image',
    model: 'language',
    collection: 'apps',
  };

  constructor(private mongo: MongoHandlerService) {
    this.mongo
      .getAllEntities()
      .then(result => {
        this.entities = result.filter(
          _entity => _entity.finished && _entity.online,
        );
      })
      .catch(e => console.error(e));
  }

  ngOnInit() {}
}
