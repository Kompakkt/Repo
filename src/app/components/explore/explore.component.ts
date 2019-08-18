import { Component, OnInit } from '@angular/core';

import { IEntity } from '../../interfaces';
import { AccountService } from '../../services/account.service';
import { MongoHandlerService } from '../../services/mongo-handler.service';

@Component({
  selector: 'app-explore-entities',
  templateUrl: './explore.component.html',
  styleUrls: ['./explore.component.scss'],
})
export class ExploreComponent implements OnInit {
  public isAuthenticated: boolean;
  public entities: IEntity[] = [];

  public selectedEntity;

  constructor(
    private account: AccountService,
    private mongo: MongoHandlerService,
  ) {
    this.mongo
      .getAllEntities()
      .then(result => {
        this.entities = result.filter(
          _entity => _entity.finished && _entity.online,
        );
      })
      .catch(e => console.error(e));

    this.selectedEntity = false;
    this.isAuthenticated = false;

    this.account.isUserAuthenticatedObservable.subscribe(
      state => (this.isAuthenticated = state),
    );
  }

  public select(entity: IEntity) {
    this.selectedEntity._id === entity._id
      ? (this.selectedEntity = false)
      : (this.selectedEntity = entity);
  }

  ngOnInit() {}
}
