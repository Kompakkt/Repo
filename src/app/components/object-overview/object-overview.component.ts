import { Component, OnInit } from '@angular/core';

import { IEntity } from '../../interfaces';
import { MongoHandlerService } from '../../services/mongo-handler.service';

@Component({
  selector: 'app-object-overview',
  templateUrl: './object-overview.component.html',
  styleUrls: ['./object-overview.component.scss'],
})
export class ObjectOverviewComponent implements OnInit {
  public entities: IEntity[] = [];

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
