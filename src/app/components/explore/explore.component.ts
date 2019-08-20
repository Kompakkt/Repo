import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material';
import { BehaviorSubject, ReplaySubject } from 'rxjs';

import { ICompilation, IEntity, IGroup, ILDAPData } from '../../interfaces';
import { MediaTypePipe } from '../../pipes/media-type';
import { AccountService } from '../../services/account.service';
import { MongoHandlerService } from '../../services/mongo-handler.service';
// tslint:disable-next-line:max-line-length
import { AddCompilationWizardComponent } from '../wizards/add-compilation/add-compilation-wizard.component';
import { AddEntityWizardComponent } from '../wizards/add-entity/add-entity-wizard.component';

@Component({
  selector: 'app-explore-entities',
  templateUrl: './explore.component.html',
  styleUrls: ['./explore.component.scss'],
  providers: [MediaTypePipe],
})
export class ExploreComponent implements OnInit {
  public searchText = '';

  public filterCollections = true;
  public filterEntities = true;

  public showEntities = false;
  public showImages = false;
  public showAudio = false;
  public showVideo = false;
  public mediaTypes = new FormControl();
  public selected: string[] = [
    'showEntities',
    'showImages',
    'showAudio',
    'showVideo',
  ];

  public filterAnnotated = false;

  // evt. beides bzw. nur collections und nur default
  public showRestricted = false;
  public filterAnnotatable = false;

  // nur bei LogIn die persönlichen
  public filterPersonal = false;
  public unfinished = false;
  public unpublished = false;

  // nur login und dann alle persönlichen, diese bei general mit filter rausfiltern
  public userPlaysRole = false;
  // ******
  public associatedModels: IEntity[] = [];
  public associatedModelIDs: string[] = [];
  private partakingCompilations: ICompilation[] = [];

  public filter = {
    public: true,
    private: true,
    restricted: true,
    unfinished: true,
  };
  // all Entities === finished && online
  public generalEntities: IEntity[] = [];
  public generalCompilations: ICompilation[] = [];

  public personalEntities: IEntity[] = [];
  public filteredPersonalEntities: IEntity[] = [];
  public personalCompilations: ICompilation[] = [];

  public userData: ILDAPData | undefined;
  public isAuthenticated = false;

  public selectedEntity;
  private foundEntities: IEntity[] = [];

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
      if (!this.userData) return;

      this.mongo
        .findUserInCompilations()
        .then(result => {
          if (result.status === 'ok') {
            this.partakingCompilations = result.compilations;
          } else {
            throw new Error(result.message);
          }
        })
        .catch(e => console.error(e));

      // TODO
      this.showAssociatedModels();

      this.updateFilter();
    });

    this.selectedEntity = false;
  }

  public updateFilter = () => {
    const updatedList: IEntity[] = [];
    if (this.filter.public) {
      updatedList.push(...this.getPublicEntities());
    }
    if (this.filter.private) {
      updatedList.push(...this.getPrivateEntities());
    }
    if (this.filter.restricted) {
      updatedList.push(...this.getRestrictedEntities());
    }
    if (this.filter.unfinished) {
      updatedList.push(...this.getUnfinishedEntities());
    }

    this.filteredPersonalEntities = Array.from(new Set(updatedList));
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

  // Restricted: finished && online && whitelist.enabled
  public getRestrictedEntities = () =>
    this.userData && this.userData.data.entity
      ? (this.userData.data.entity as IEntity[]).filter(
          entity =>
            entity.finished && entity.online && entity.whitelist.enabled,
        )
      : [];

  // Unfinished: !finished
  public getUnfinishedEntities = () =>
    this.userData && this.userData.data.entity
      ? (this.userData.data.entity as IEntity[]).filter(
          entity => !entity.finished,
        )
      : [];

  public select(entity: IEntity) {
    this.selectedEntity._id === entity._id
      ? (this.selectedEntity = false)
      : (this.selectedEntity = entity);

    console.log(entity);
  }

  public search = () =>
    this.mongo
      .searchEntity(this.searchText)
      .then(result => (this.foundEntities = result))
      .catch(e => console.error(e));

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

  public getPartakingCompilations = () => this.partakingCompilations;

  // TODO check if this is still valid - from old Repo and find a way to search for associated compilations
  public async showAssociatedModels() {
    if (!this.userData) {
      throw new Error('Userdata missing');
      return;
    }
    const addModelsToArray = async filter => {
      if (!this.userData) {
        throw new Error('Userdata missing');
        return;
      }
      await this.mongo
        .searchEntity(this.userData[filter])
        .then(result => {
          this.associatedModelIDs = this.associatedModelIDs.concat(
            String(result),
          );
        })
        .catch(e => console.error(e));
    };

    await addModelsToArray('surname');
    await addModelsToArray('prename');
    await addModelsToArray('username');
    await addModelsToArray('mail');

    const modelsSet = new Set(this.associatedModelIDs);
    this.associatedModelIDs = Array.from(modelsSet.values());

    for (const id of this.associatedModelIDs) {
      this.mongo
        .getEntity(id)
        .then(result => {
          this.associatedModels.push(result);
        })
        .catch(e => console.error(e));
    }
  }

  ngOnInit() {}
}
