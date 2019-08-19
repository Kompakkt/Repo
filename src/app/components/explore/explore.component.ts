import {Component, OnInit} from '@angular/core';
import {FormControl} from '@angular/forms';
import {MatDialog} from '@angular/material';
import {BehaviorSubject, ReplaySubject} from 'rxjs';

import {ICompilation, IEntity, IGroup, ILDAPData} from '../../interfaces';
import {MediaTypePipe} from '../../pipes/media-type';
import {AccountService} from '../../services/account.service';
import {MongoHandlerService} from '../../services/mongo-handler.service';
// tslint:disable-next-line:max-line-length
import {AddCompilationWizardComponent} from '../wizards/add-compilation/add-compilation-wizard.component';
import {AddEntityWizardComponent} from '../wizards/add-entity/add-entity-wizard.component';

@Component({
               selector: 'app-explore-entities',
               templateUrl: './explore.component.html',
               styleUrls: ['./explore.component.scss'],
               providers: [MediaTypePipe],
           })

export class ExploreComponent implements OnInit {
    public isAuthenticated: boolean;
    // public entities: IEntity[] = [];
    // public compilations: ICompilation[] = [];

    private Subjects = {
        entities: new BehaviorSubject<IEntity[]>(Array<IEntity>()),
        collections: new BehaviorSubject<ICompilation[]>(Array<ICompilation>()),
    };

    public Observables = {
        entities: this.Subjects.entities.asObservable(),
        collections: this.Subjects.collections.asObservable(),
    };

    public selectedEntity;

    public filterCollections = true;
    public filterEntities = true;
    public filterPersonal = false;
    public filterAnnotated = false;

    public showEntities = false;
    public showImages = false;
    public showAudio = false;
    public showVideo = false;

    mediaTypes = new FormControl();
    selected: string[] = ['showEntities', 'showImages', 'showAudio', 'showVideo'];

    private foundEntities: IEntity[] = [];
    public searchText = '';

    public userData: ILDAPData | undefined;
    private partakingGroups: IGroup[] = [];
    private partakingCompilations: ICompilation[] = [];

    constructor(
        private account: AccountService,
        private mongo: MongoHandlerService,
        private dialog: MatDialog,
    ) {
        this.mongo
            .getAllEntities()
            .then(entities => {
                const entitiesforBrowser: IEntity[] = [];

                entities
                    .filter(entity => entity)
                    .forEach((entity: IEntity) => {
                        if (entity.finished && entity.online) {
                            entitiesforBrowser.push(entity);
                        }
                    });
                this.Subjects.entities.next(entitiesforBrowser);
            })
            .catch(e => console.error(e));

        this.mongo
            .getAllCompilations()
            .then(compilations => {
                const compilationsforBrowser: ICompilation[] = [];

                compilations
                    .filter(compilation => compilation)
                    .forEach((compilation: ICompilation) => {
                        compilationsforBrowser.push(compilation);
                    });
                console.log(compilationsforBrowser);
                this.Subjects.collections.next(compilationsforBrowser);
            })
            .catch(e => console.error(e));

        this.selectedEntity = false;
        this.isAuthenticated = false;

        this.account.isUserAuthenticatedObservable.subscribe(
            state => (this.isAuthenticated = state),
        );

        this.account.userDataObservable.subscribe(newData => {
            this.userData = newData;
            console.log('Userdata received in ProfilePageComponent', this.userData);
            if (!this.userData) return;
            this.mongo
                .findUserInGroups()
                .then(result => {
                    if (result.status === 'ok') {
                        this.partakingGroups = result.groups;
                    } else {
                        throw new Error(result.message);
                    }
                })
                .catch(e => console.error(e));

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
            // this.updateFilter();
        });
    }

    public select(entity: IEntity) {
        this.selectedEntity._id === entity._id
            ? (this.selectedEntity = false)
            : (this.selectedEntity = entity);

        console.log(entity)
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
                    //this.updateFilter();
                }
            });
    }

    ngOnInit() {
    }
}
