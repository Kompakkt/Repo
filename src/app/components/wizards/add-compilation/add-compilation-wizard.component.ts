import { Component, OnInit } from '@angular/core';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { StepperSelectionEvent } from '@angular/cdk/stepper';
import {
  MatAutocompleteSelectedEvent,
  MatInput,
  MatSelectChange,
  MatStepper,
  MatStep,
} from '@angular/material';

import { MongoHandlerService } from '../../../services/mongo-handler.service';
import { AccountService } from '../../../services/account.service';
import { ICompilation, IEntity, IGroup, IUserData } from '../../../interfaces';

@Component({
  selector: 'app-add-compilation-wizard',
  templateUrl: './add-compilation-wizard.component.html',
  styleUrls: ['./add-compilation-wizard.component.scss'],
})
export class AddCompilationWizardComponent implements OnInit {
  public compilation: ICompilation = this.generateEmptyCompilation();

  // ToDo Add correct data type
  private foundEntities: any = [];
  public searchText = '';

  public searchPersonText = '';
  public searchGroupText = '';

  private allPersons: IUserData[] = [];
  private allGroups: IGroup[] = [];

  private selfUserData: IUserData = {
    _id: '',
    username: '',
    fullname: '',
  };

  public userCompilations: ICompilation[] = [];

  public isSubmitting = false;
  public isSubmitted = false;

  constructor(
    private mongo: MongoHandlerService,
    private account: AccountService,
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
  }

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

  public search = () =>
    this.mongo
      .searchEntity(this.searchText)
      .then(result => (this.foundEntities = result))
      .catch(e => console.error(e));

  public validateNaming = () =>
    this.compilation.name !== '' && this.compilation.description !== '';

  public validateEntities = () => this.compilation.entities.length > 0;

  public tryFinish = (stepper: MatStepper, finishStep: MatStep) => {
    this.isSubmitting = true;

    this.mongo
      .pushCompilation(this.compilation)
      .then(_ => {
        this.isSubmitting = false;
        this.isSubmitted = true;

        finishStep.completed = true;
        stepper.next();
        // Prevent user from going back
        stepper._steps.forEach(step => (step.editable = false));
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
