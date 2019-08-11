import { Component, OnInit } from '@angular/core';
import {
  MatAutocompleteSelectedEvent,
  MatDialog,
  MatInput,
  MatStep,
  MatStepper,
} from '@angular/material';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { StepperSelectionEvent } from '@angular/cdk/stepper';

import { AccountService } from '../../../services/account.service';
import { ConfirmationDialogComponent } from '../../dialogs/confirmation-dialog/confirmation-dialog.component';
import { IGroup, IUserData } from '../../../interfaces';
import { MongoHandlerService } from '../../../services/mongo-handler.service';

@Component({
  selector: 'app-add-group-wizard',
  templateUrl: './add-group-wizard.component.html',
  styleUrls: ['./add-group-wizard.component.scss'],
})
export class AddGroupWizardComponent implements OnInit {
  public group: IGroup = this.createEmptyGroup();

  private selfUserData: IUserData = {
    _id: '',
    username: '',
    fullname: '',
  };

  public isSubmitting = false;
  public isSubmitted = false;

  public searchPersonText = '';

  private allAccounts: IUserData[] = [];

  constructor(
    private account: AccountService,
    private mongo: MongoHandlerService,
    public dialog: MatDialog,
  ) {
    this.account.userDataObservable.subscribe(result => {
      if (result) {
        this.selfUserData = {
          _id: result._id,
          username: result.username,
          fullname: result.fullname,
        };
        this.group.creator = this.selfUserData;
      } else {
        this.group.creator = {
          _id: '',
          username: '',
          fullname: '',
        };
      }
    });

    this.mongo
      .getAccounts()
      .then(result => (this.allAccounts = result))
      .catch(e => console.error(e));
  }

  public getPersons = () =>
    this.allAccounts.filter(
      _p =>
        this.group.members.indexOf(_p) < 0 &&
        this.group.owners.indexOf(_p) < 0 &&
        (this.group.creator ? this.group.creator._id !== _p._id : true),
    );

  public selectAutocompletePerson = (
    input: MatInput,
    event: MatAutocompleteSelectedEvent,
  ) => {
    this.group.members.push(event.option.value);
    this.searchPersonText = '';
    input.value = this.searchPersonText;
  };

  ngOnInit() {}

  public createEmptyGroup() {
    return {
      name: '',
      creator: this.selfUserData,
      owners: new Array<IUserData>(),
      members: new Array<IUserData>(),
    };
  }

  public validateNaming() {
    return (
      this.group.name !== '' &&
      this.group.creator._id !== '' &&
      this.selfUserData._id !== ''
    );
  }

  public validatePersons() {
    return (
      (this.group.members.length > 0 || this.group.owners.length > 0) &&
      this.group.creator
    );
  }

  public removePerson(id) {
    // ToDo Remove code duplication
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: 'Are you sure you want to remove this person from your group?',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.group.members = this.group.members.filter(_p => _p._id !== id);
        this.group.owners = this.group.owners.filter(_p => _p._id !== id);
      }
    });
  }

  public drop(event: CdkDragDrop<IUserData[]>) {
    const person = event.previousContainer.data[event.previousIndex];
    if (!event.isPointerOverContainer) {
      const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
        data: 'Are you sure you want to remove this person from your group?',
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.group.members = this.group.members.filter(
            _p => _p._id !== person._id,
          );
          this.group.owners = this.group.owners.filter(
            _p => _p._id !== person._id,
          );
        }
      });
    }

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

  // Steps require interaction before they can be completed
  // but some steps might be correct out of the box.
  // mark steps as interacted with on selection
  public stepInteraction(event: StepperSelectionEvent) {
    event.selectedStep.interacted = true;
  }

  public tryFinish(stepper: MatStepper, lastStep: MatStep) {
    this.isSubmitting = true;

    this.mongo
      .pushGroup(this.group)
      .then(result => {
        this.isSubmitting = false;
        this.isSubmitted = true;

        lastStep.completed = true;
        stepper.next();
        stepper._steps.forEach(step => (step.editable = false));
      })
      .catch(e => {
        console.error(e);
        this.isSubmitting = false;
      });
  }
}
