import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material';

import { ICompilation, IEntity, ILDAPData } from '../../interfaces';
import { EntitiesFilter } from '../../pipes/entities-filter';
import { AccountService } from '../../services/account.service';
import { MongoHandlerService } from '../../services/mongo-handler.service';
// tslint:disable-next-line:max-line-length
import { AddCompilationWizardComponent } from '../wizards/add-compilation/add-compilation-wizard.component';
import { AddEntityWizardComponent } from '../wizards/add-entity/add-entity-wizard.component';

@Component({
  selector: 'app-explore-entities',
  templateUrl: './explore.component.html',
  styleUrls: ['./explore.component.scss'],
  providers: [EntitiesFilter],
})
export class ExploreComponent implements OnInit {

  // general Filter
  public annotated = false;
  public restricted = false;

  // mediaTypes
  public model = false;
  public image = false;
  public audio = false;
  public video = false;

  public mediaTypes = new FormControl();
  public selected: string[] = [
    'showModels',
    'showImages',
    'showAudio',
    'showVideo',
  ];

  public searchText = '';

  public showCollections = true;
  public showEntities = true;

  public showOnlyMine = false;
  // TODO showOnlyAnnotatable
  public showOnlyAnnotatable = false;
  public userPlaysRole = false;

  public filter = {
    public: true,
    unpublished: true,
    unfinished: true,
  };

  // all Entities === finished && online
  public generalEntities: IEntity[] = [];
  public generalCompilations: ICompilation[] = [];

  public personalEntities: IEntity[] = [];
  // TODO personalCompilations
  public personalCompilations: ICompilation[] = [];

  public userData: ILDAPData | undefined;
  public isAuthenticated = false;

  public selectedEntity;

  constructor(
    private account: AccountService,
    private mongo: MongoHandlerService,
    private dialog: MatDialog,
  ) {
    this.mongo
      .getAllEntities()
      .then(result => {
        this.generalEntities = result.filter(
          _entity => _entity.finished && _entity.online,
        );
      })
      .catch(e => console.error(e));

    this.mongo
      .getAllCompilations()
      .then(result => {
        this.generalCompilations = result;
      })
      .catch(e => console.error(e));

    this.account.isUserAuthenticatedObservable.subscribe(
      state => (this.isAuthenticated = state),
    );

    this.account.userDataObservable.subscribe(newData => {
      this.userData = newData;
      console.log('Userdata received in ProfilePageComponent', this.userData);
      if (!this.userData) return;
      this.updateFilter();
    });

    this.selectedEntity = false;
  }

  public select(entity: IEntity) {
    this.selectedEntity._id === entity._id
      ? (this.selectedEntity = false)
      : (this.selectedEntity = entity);

    console.log(entity);
  }

  public updateFilter = () => {
    const updatedList: IEntity[] = [];
    if (this.filter.public) {
      updatedList.push(...this.getPublicEntities());
    }
    if (this.filter.private) {
      updatedList.push(...this.getPrivateEntities());
    }
    if (this.filter.unfinished) {
      updatedList.push(...this.getUnfinishedEntities());
    }

    this.personalEntities = Array.from(new Set(updatedList));
  };

  // Entities
  // Public: finished && online && !whitelist.enabled
  public getPublicEntities = () =>
      this.userData && this.userData.data.entity
          ? (this.userData.data.entity as IEntity[]).filter(
          entity =>
              entity.finished && entity.online && !entity.whitelist.enabled,
          )
          : [];

  // Private: finished && !online
  public getPrivateEntities = () =>
      this.userData && this.userData.data.entity
          ? (this.userData.data.entity as IEntity[]).filter(
          entity => entity.finished && !entity.online,
          )
          : [];

  // Unfinished: !finished
  public getUnfinishedEntities = () =>
      this.userData && this.userData.data.entity
          ? (this.userData.data.entity as IEntity[]).filter(
          entity => !entity.finished,
          )
          : [];

  public openCompilationCreation(compilation?: ICompilation) {
    const dialogRef = this.dialog.open(AddCompilationWizardComponent, {
      data: compilation ? compilation : undefined,
      disableClose: true,
    });
    dialogRef
      .afterClosed()
      .toPromise()
      .then(result => {
        if (result && this.userData && this.userData.data.compilation) {
          if (compilation) {
            const index = (this.userData.data
              .compilation as ICompilation[]).findIndex(
              comp => comp._id === result._id,
            );
            if (index === -1) return;
            this.userData.data.compilation.splice(
              index,
              1,
              result as ICompilation,
            );
          } else {
            (this.userData.data.compilation as ICompilation[]).push(
              result as ICompilation,
            );
          }
        }
      });
  }

  public openEntityCreation(entity?: IEntity) {
    const dialogRef = this.dialog.open(AddEntityWizardComponent, {
      data: entity ? entity : undefined,
      disableClose: true,
    });

    dialogRef
      .afterClosed()
      .toPromise()
      .then(result => {
        if (result && this.userData && this.userData.data.entity) {
          const index = (this.userData.data.entity as IEntity[]).findIndex(
            _en => result._id === _en._id,
          );
          if (index === -1) return;
          this.userData.data.entity.splice(index, 1, result as IEntity);
          // this.updateFilter();
        }
      });
  }

  ngOnInit() {}
}
