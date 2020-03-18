import { Component, OnInit, Optional, Inject } from '@angular/core';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { StepperSelectionEvent } from '@angular/cdk/stepper';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatInput } from '@angular/material/input';
import { MatSelectChange } from '@angular/material/select';
import { MatStepper, MatStep } from '@angular/material/stepper';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';

import { MongoHandlerService } from '../../services/mongo-handler.service';
import { AccountService } from '../../services/account.service';
import {
  ICompilation,
  IEntity,
  IGroup,
  IStrippedUserData,
} from '../../interfaces';
import { isCompilation } from '../../typeguards';

@Component({
  selector: 'app-add-compilation-wizard',
  templateUrl: './add-compilation-wizard.component.html',
  styleUrls: ['./add-compilation-wizard.component.scss'],
})
export class AddCompilationWizardComponent implements OnInit {
  public compilation: ICompilation = this.generateEmptyCompilation();

  private foundEntities: IEntity[] = [];
  public searchText = '';

  public searchPersonText = '';
  public searchGroupText = '';

  private allPersons: IStrippedUserData[] = [];
  private allGroups: IGroup[] = [];

  private selfUserData: IStrippedUserData = {
    _id: '',
    username: '',
    fullname: '',
  };

  public userCompilations: ICompilation[] = [];

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
    private mongo: MongoHandlerService,
    private account: AccountService,
    // When opened as a dialog
    @Optional() public dialogRef: MatDialogRef<AddCompilationWizardComponent>,
    @Optional()
    @Inject(MAT_DIALOG_DATA)
    private dialogData: ICompilation | undefined,
  ) {
    this.account.userDataObservable.subscribe(result => {
      this.selfUserData = {
        _id: result._id,
        fullname: result.fullname,
        username: result.username,
      };
      this.userCompilations = result.data.compilation
        ? (result.data.compilation as ICompilation[])
        : [];
    });

    // TODO: handle errors
    this.mongo
      .getAccounts()
      .then(result => (this.allPersons = result))
      .catch(e => console.error(e));
    this.mongo
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
        this.mongo.getCompilation(this.dialogData._id).then(result => {
          if (isCompilation(result)) this.compilation = result;
          this.isLoading = false;
        });
      } else {
        this.compilation = this.dialogData;
      }
    } else {
      // Assume its an entity _id
      // TODO: Typeguard for _ids
      this.mongo
        .getEntity(this.dialogData)
        .then(result => this.compilation.entities.push(result))
        .catch(e => console.log('Failed getting entity', e, this.dialogData));
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
    return {
      _id: '',
      name: '',
      description: '',
      password: '',
      entities: new Array(),
      annotationList: new Array(),
      whitelist: {
        enabled: false,
        persons: new Array(),
        groups: new Array(),
      },
    };
  }

  // Return difference between full & selected entities/persons/groups
  public getPersons = () =>
    this.allPersons
      .filter(_p => this.compilation.whitelist.persons.indexOf(_p) < 0)
      .filter(_p => _p._id !== this.selfUserData._id);
  public getGroups = () =>
    this.allGroups.filter(
      _g => this.compilation.whitelist.groups.indexOf(_g) < 0,
    );
  public getEntities = () =>
    this.foundEntities
      .filter(obj => obj)
      .filter(
        _e => !this.compilation.entities.find(_se => _se && _se._id === _e._id),
      );

  public drop(event: CdkDragDrop<string[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    }
  }

  public addEntityToCompilation(index: number) {
    transferArrayItem(
      this.foundEntities,
      this.compilation.entities,
      index,
      this.compilation.entities.length - 1,
    );
    setTimeout(() => (this.foundEntities = this.getEntities()), 0);
  }

  public removeEntityFromCompilation(index: number) {
    transferArrayItem(this.compilation.entities, this.foundEntities, index, 0);
    setTimeout(
      () =>
        (this.foundEntities = this.foundEntities.sort((a, b) =>
          a.name.localeCompare(b.name),
        )),
      0,
    );
  }

  public selectCompilation(event: MatSelectChange) {
    this.compilation = event.value;
  }

  public selectAutocompletePerson = (
    input: MatInput,
    event: MatAutocompleteSelectedEvent,
  ) => {
    this.compilation.whitelist.persons.push(event.option.value);
    this.searchPersonText = '';
    input.value = this.searchPersonText;
  };

  public selectAutocompleteGroup = (
    input: MatInput,
    event: MatAutocompleteSelectedEvent,
  ) => {
    this.compilation.whitelist.groups.push(event.option.value);
    this.searchGroupText = '';
    input.value = this.searchGroupText;
  };

  public removePerson = (person: any) =>
    (this.compilation.whitelist.persons = this.compilation.whitelist.persons.filter(
      _p => _p !== person,
    ));

  public removeGroup = (group: any) =>
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

    this.mongo
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

  public validateNaming = () =>
    this.compilation.name !== '' && this.compilation.description !== '';

  public validateEntities = () => this.compilation.entities.length > 0;

  public tryFinish = (stepper: MatStepper, finishStep: MatStep) => {
    this.isSubmitting = true;

    this.mongo
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
