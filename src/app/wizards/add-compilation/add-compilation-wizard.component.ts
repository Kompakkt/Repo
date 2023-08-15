import { Component, OnInit, Optional, Inject } from '@angular/core';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { StepperSelectionEvent } from '@angular/cdk/stepper';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatSelectChange } from '@angular/material/select';
import { MatStepper, MatStep } from '@angular/material/stepper';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';

import { BackendService, AccountService } from 'src/app/services';
import { SortOrder } from 'src/app/services/backend.service';
import {
  isEntity,
  isCompilation,
  ObjectId,
  ICompilation,
  IEntity,
  IGroup,
  IStrippedUserData,
} from 'src/common';
import { TranslateService } from './../../services/translate/translate.service';

@Component({
  selector: 'app-add-compilation-wizard',
  templateUrl: './add-compilation-wizard.component.html',
  styleUrls: ['./add-compilation-wizard.component.scss'],
})
export class AddCompilationWizardComponent implements OnInit {
  public compilation: ICompilation = this.generateEmptyCompilation();

  private foundEntities: IEntity[] = [];
  private compEntities: IEntity[] = [];
  public searchText = '';

  public searchPersonText = '';
  public searchGroupText = '';

  private allPersons: IStrippedUserData[] = [];
  private allGroups: IGroup[] = [];

  private strippedUser: IStrippedUserData = {
    _id: '',
    username: '',
    fullname: '',
  };

  public isSubmitting = false;
  public isSubmitted = false;

  public paginatorLength = Number.POSITIVE_INFINITY;
  public paginatorPageSize = 20;
  public paginatorPageIndex = 0;
  public searchOffset = 0;

  public searchTextTimeout: undefined | any;

  public icons = {
    audio: 'audiotrack',
    video: 'movie',
    image: 'image',
    model: 'language',
    collection: 'apps',
  };

  public isLoading = false;

  constructor(
    private translate: TranslateService,
    private backend: BackendService,
    private account: AccountService,
    // When opened as a dialog
    @Optional() public dialogRef: MatDialogRef<AddCompilationWizardComponent>,
    @Optional()
    @Inject(MAT_DIALOG_DATA)
    private dialogData: ICompilation | string | undefined,
  ) {
    this.translate.use(window.navigator.language.split('-')[0]);
    this.account.isAuthenticated$.subscribe(isAuthenticated => {
      if (!isAuthenticated) this.dialogRef.close('User is not authenticated');
    });
    this.account.strippedUser$.subscribe(strippedUser => {
      this.strippedUser = strippedUser;
    });

    // TODO: handle errors
    this.backend
      .getAccounts()
      .then(result => (this.allPersons = result))
      .catch(e => console.error(e));
    this.backend
      .getGroups()
      .then(result => (this.allGroups = result))
      .catch(e => console.error(e));
  }

  ngOnInit() {
    this.search();
    if (!this.dialogRef || !this.dialogData) return;

    if (isCompilation(this.dialogData)) {
      // Explicit check for 'true' to see if this compilation got censored
      if (this.dialogData.password === true) {
        this.isLoading = true;
        this.backend.getCompilation(this.dialogData._id).then(result => {
          if (isCompilation(result)) this.compilation = result;
          this.isLoading = false;
        });
      } else {
        this.compilation = this.dialogData;
        // Patch from compEntities array to the entities object
        for (const id in this.compilation.entities) {
          const entity = this.compilation.entities[id];
          if (!isEntity(entity)) continue;
          this.compEntities.push(entity);
        }
      }
    } else if (isEntity(this.dialogData)) {
      this.compEntities.push(this.dialogData);
    } else if (ObjectId.isValid(this.dialogData)) {
      // When creating a new compilation with an entity (e.g. on the explore page)
      // we can already add the entity here
      this.backend
        .getEntity(this.dialogData)
        .then(result => {
          this.compEntities.push(result);
        })
        .catch(e => console.log('Failed getting entity', e, this.dialogData));
    } else {
      console.error('Failed creating or opening compilation');
    }
  }

  public changePage(event: PageEvent) {
    this.searchOffset = event.pageIndex * this.paginatorPageSize;
    this.paginatorPageIndex = event.pageIndex;
    this.search(true);
  }

  public searchTextChanged = () => {
    if (this.searchTextTimeout) {
      clearTimeout(this.searchTextTimeout);
    }
    this.searchTextTimeout = setTimeout(() => {
      this.search();
    }, 250);
  };

  public generateEmptyCompilation() {
    const compilation: ICompilation = {
      _id: '',
      name: '',
      description: '',
      password: '',
      entities: {},
      annotations: {},
      whitelist: {
        enabled: false,
        persons: new Array(),
        groups: new Array(),
      },
      creator: this.strippedUser,
    };
    return compilation;
  }

  // Return difference between full & selected entities/persons/groups
  get persons() {
    return this.allPersons
      .filter(_p => this.compilation.whitelist.persons.indexOf(_p) < 0)
      .filter(_p => _p._id !== this.strippedUser._id);
  }
  get groups() {
    return this.allGroups.filter(_g => this.compilation.whitelist.groups.indexOf(_g) < 0);
  }
  get availableEntities() {
    return this.foundEntities
      .filter(obj => obj)
      .filter(_e => !this.compEntities.find(_se => _se && _se._id === _e._id));
  }
  get currentEntities() {
    return this.compEntities;
  }

  public drop(event: CdkDragDrop<IEntity[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    }
  }

  private sortEntitiesByName = (a: IEntity, b: IEntity) => a.name.localeCompare(b.name);

  public addEntityToCompilation(index: number) {
    const entity = this.foundEntities.splice(index, 1)[0] ?? undefined;
    if (!isEntity(entity)) return;
    this.compEntities.push(entity);
    this.compEntities.sort(this.sortEntitiesByName);
  }

  public removeEntityFromCompilation(index: number) {
    const entity = this.compEntities.splice(index, 1)[0] ?? undefined;
    if (!isEntity(entity)) return;
    this.foundEntities.push(entity);
    this.foundEntities.sort(this.sortEntitiesByName);
  }

  public selectCompilation(event: MatSelectChange) {
    this.compilation = event.value;
  }

  public selectAutocompletePerson = (
    input: HTMLInputElement,
    event: MatAutocompleteSelectedEvent,
  ) => {
    this.compilation.whitelist.persons.push(event.option.value);
    this.searchPersonText = '';
    input.value = this.searchPersonText;
  };

  public selectAutocompleteGroup = (
    input: HTMLInputElement,
    event: MatAutocompleteSelectedEvent,
  ) => {
    this.compilation.whitelist.groups.push(event.option.value);
    this.searchGroupText = '';
    input.value = this.searchGroupText;
  };

  public removePerson = (person: IStrippedUserData) =>
    (this.compilation.whitelist.persons = this.compilation.whitelist.persons.filter(
      _p => _p !== person,
    ));

  public removeGroup = (group: IGroup) =>
    (this.compilation.whitelist.groups = this.compilation.whitelist.groups.filter(
      _g => _g !== group,
    ));

  public search = (changedPage = false) => {
    if (!changedPage) {
      this.searchOffset = 0;
      this.paginatorLength = Number.POSITIVE_INFINITY;
      this.paginatorPageIndex = 0;
      this.paginatorPageSize = 20;
    }

    this.backend
      .explore({
        searchEntity: true,
        filters: {
          annotatable: false,
          annotated: false,
          restricted: false,
          associated: false,
        },
        types: ['model', 'image', 'audio', 'video'],
        offset: this.searchOffset,
        searchText: this.searchText,
        reversed: false,
        sortBy: SortOrder.popularity,
      })
      .then(result => {
        if (!Array.isArray(result.array)) return;
        this.foundEntities = result.array as IEntity[];
        if (result.array.length < 20) {
          this.paginatorLength = this.searchOffset + result.array.length;
        }
      })
      .catch(e => console.error(e));
  };

  public validateNaming = () => this.compilation.name !== '' && this.compilation.description !== '';

  public validateEntities = () => this.compEntities.length > 0;

  public tryFinish = (stepper: MatStepper, finishStep: MatStep) => {
    this.isSubmitting = true;

    // Patch from compEntities array to the entities object
    this.compilation.entities = {};
    for (const entity of this.compEntities) {
      this.compilation.entities[entity._id.toString()] = entity;
    }

    // Overwrite possibly empty creator
    this.compilation.creator = this.strippedUser;
    if (this.compilation.creator._id === '') {
      throw new Error('No compilation creator');
    }

    this.backend
      .pushCompilation(this.compilation)
      .then(result => {
        this.isSubmitting = false;
        this.isSubmitted = true;

        finishStep.completed = true;
        stepper.next();
        // Prevent user from going back
        stepper._steps.forEach(step => (step.editable = false));

        if (this.dialogRef) {
          this.dialogRef.close(result);
        }
      })
      .catch(e => {
        // TODO: inform user of failure
        this.isSubmitted = false;
        this.isSubmitting = false;
        console.error(e);
      });
  };

  // Steps require interaction before they can be completed
  // but some steps might be correct out of the box.
  // mark steps as interacted with on selection
  public stepInteraction(event: StepperSelectionEvent) {
    event.selectedStep.interacted = true;
  }
}
