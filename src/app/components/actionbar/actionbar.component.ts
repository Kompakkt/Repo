import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {FormControl} from '@angular/forms';
import {MatDialog} from '@angular/material/dialog';
import {PageEvent} from '@angular/material/paginator';
import {MatSelectChange} from '@angular/material/select';

import {ConfirmationDialogComponent} from '../../dialogs/confirmation-dialog/confirmation-dialog.component';
import {UploadApplicationDialogComponent} from '../../dialogs/upload-application-dialog/upload-application-dialog.component';
import {EUserRank, ICompilation, IEntity, IUserData} from '../../interfaces';
import {AccountService} from '../../services/account.service';
import {MongoHandlerService} from '../../services/mongo-handler.service';
import {AddCompilationWizardComponent} from '../wizards/add-compilation/add-compilation-wizard.component';
import {AddEntityWizardComponent} from '../wizards/add-entity/add-entity-wizard.component';

@Component({
    selector: 'app-actionbar',
    templateUrl: './actionbar.component.html',
    styleUrls: ['./actionbar.component.scss'],
})
export class ActionbarComponent {

    public mediaTypesOptions = [
        {
            name: '3D Models',
            enabled: true,
            value: 'model',
        },
        {
            name: 'Audio',
            enabled: true,
            value: 'audio',
        },
        {
            name: 'Video',
            enabled: true,
            value: 'video',
        },
        {
            name: 'Image',
            enabled: true,
            value: 'image',
        },
    ];
    public mediaTypesSelected = new FormControl(
        this.mediaTypesOptions.filter(el => el.enabled).map(el => el.value),
    );

    public searchText = '';

    // Slider option
    public showCompilations = false;

    public filterTypesOptions = [
        {
            enabled: false,
            name: 'Annotatable',
            value: 'annotatable',
            help: 'Only show entities you are allowed to annotate',
            onlyOnEntity: false,
        },
        {
            enabled: false,
            name: 'Annotated',
            value: 'annotated',
            help: 'Only show entities that have been annotated',
            onlyOnEntity: false,
        },
        {
            enabled: false,
            name: 'Restricted',
            value: 'restricted',
            help: 'Only show entities that are not public, but where you have access',
            onlyOnEntity: false,
        },
        {
            enabled: false,
            name: 'Associated',
            value: 'associated',
            help: 'Only show entities where you are mentioned in metadata',
            onlyOnEntity: true,
        },
    ];
    public filterTypesSelected = new FormControl(
        this.filterTypesOptions.filter(el => el.enabled)
            .map(el => el.value),
    );

    public filteredResults: Array<IEntity | ICompilation> = [];

    public userData: IUserData | undefined;
    public isAuthenticated = false;

    public selectedElement: IEntity | ICompilation | undefined;

    public icons = {
        audio: 'audiotrack',
        video: 'movie',
        image: 'image',
        model: 'language',
        collection: 'apps',
    };

    public searchTextTimeout: undefined | any;
    public searchOffset = 0;
    public paginatorLength = Number.POSITIVE_INFINITY;
    public paginatorPageSize = 20;
    public paginatorPageIndex = 0;

    constructor(
        private account: AccountService,
        private mongo: MongoHandlerService,
        private dialog: MatDialog,
    ) {
        this.account.isUserAuthenticatedObservable.subscribe(
            state => (this.isAuthenticated = state),
        );

        this.account.userDataObservable.subscribe(newData => {
            if (!newData) return;
            this.userData = newData;
            console.log('Userdata received in ProfilePageComponent', this.userData);
        });

        this.updateFilter();
    }

    public closeSidebar() {
        this.selectedElement = undefined;
    }

    public select(element: IEntity | ICompilation) {
        this.selectedElement =
            this.selectedElement && this.selectedElement._id === element._id
                ? undefined
                : element;
    }

    public isUploader = () => {
        if (!this.userData) return false;
        return (
            this.userData.role === EUserRank.admin ||
            this.userData.role === EUserRank.uploader
        );
    };

    public isSelected = (element: IEntity | ICompilation) =>
        this.selectedElement && this.selectedElement._id === element._id;

    public updateFilter = (changedPage = false) => {
        if (!changedPage) {
            this.paginatorLength = Number.POSITIVE_INFINITY;
            this.paginatorPageIndex = 0;
            this.paginatorPageSize = 20;
            this.searchOffset = 0;
        }

        const query = {
            searchEntity: !this.showCompilations,
            searchText: this.searchText.toLowerCase(),
            types: this.mediaTypesSelected.value,
            filters: {
                annotated: false,
                annotatable: false,
                restricted: false,
                associated: false,
            },
            offset: this.searchOffset,
        };

        for (const key in query.filters) {
            if (!query.filters.hasOwnProperty(key)) continue;
            query.filters[key] = this.filterTypesSelected.value.includes(key);
        }

        this.mongo
            .explore(query)
            .then(result => {
                this.filteredResults = Array.isArray(result) ? result : [];
                if (Array.isArray(result) && result.length < this.paginatorPageSize) {
                    this.paginatorLength = result.length + this.searchOffset;
                }
            })
            .catch(e => console.error(e));
    };

    public toggleSlide = () => {
        this.showCompilations = !this.showCompilations;
        this.updateFilter();
    };

    public searchTextChanged = () => {
        if (this.searchTextTimeout) {
            clearTimeout(this.searchTextTimeout);
        }
        this.searchTextTimeout = setTimeout(() => {
            this.updateFilter();
        }, 250);
    };

    public updateMediaTypeOptions = (event: MatSelectChange) => {
        const enabledList = event.source.value as string[];
        this.mediaTypesOptions.forEach(
            el => (el.enabled = enabledList.includes(el.value)),
        );
        this.updateFilter();
    };

    public updateFilterTypeOptions = (event: MatSelectChange) => {
        const enabledList = event.source.value as string[];
        this.filterTypesOptions.forEach(
            el => (el.enabled = enabledList.includes(el.value)),
        );
        this.updateFilter();
    };

    public getFilterTypeOptions = () =>
        this.filterTypesOptions.filter(el =>
            this.showCompilations ? !el.onlyOnEntity : true,
        );

    public changePage = (event: PageEvent) => {
        this.searchOffset = event.pageIndex * event.pageSize;
        this.paginatorPageIndex = event.pageIndex;
        this.updateFilter(true);
    };

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

    public openUploadApplication() {
        if (!this.userData) {
            alert('Not logged in');
            return;
        }
        const dialogRef = this.dialog.open(UploadApplicationDialogComponent, {
            data: this.userData,
            disableClose: true,
        });

        dialogRef.backdropClick().subscribe(async _ => {
            const confirm = this.dialog.open(ConfirmationDialogComponent, {
                data: `Do you want to cancel your application?`,
            });
            await confirm
                .afterClosed()
                .toPromise()
                .then(shouldClose => {
                    if (shouldClose) {
                        dialogRef.close();
                    }
                });
        });
    }

}
