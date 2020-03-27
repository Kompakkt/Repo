import { Component, OnInit, Optional, Inject } from '@angular/core';
import { MatStep, MatStepper } from '@angular/material/stepper';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { StepperSelectionEvent } from '@angular/cdk/stepper';

import { AccountService } from '../../services/account.service';
import { ConfirmationDialogComponent } from '../../dialogs/confirmation-dialog/confirmation-dialog.component';
import { IGroup, IStrippedUserData, ObjectId } from '@kompakkt/shared';
import { BackendService } from '../../services/backend.service';
import { ObjectIdService } from '../../services/object-id.service';

@Component({
  selector: 'app-add-group-wizard',
  templateUrl: './add-group-wizard.component.html',
  styleUrls: ['./add-group-wizard.component.scss'],
})
export class AddGroupWizardComponent implements OnInit {
  public group: IGroup = this.createEmptyGroup();

  private selfUserData: IStrippedUserData = {
    _id: '',
    username: '',
    fullname: '',
  };

  public isSubmitting = false;
  public isSubmitted = false;

  public searchPersonText = '';
  public personSearchInput = '';

  private allAccounts: IStrippedUserData[] = [];

  constructor(
    private account: AccountService,
    private backend: BackendService,
    public dialog: MatDialog,
    private objectId: ObjectIdService,
    // When opened as a dialog
    @Optional() public dialogRef: MatDialogRef<AddGroupWizardComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) private dialogData: IGroup | undefined,
  ) {
    this.account.userData$.subscribe(result => {
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

    this.backend
      .getAccounts()
      .then(result => (this.allAccounts = result))
      .catch(e => console.error(e));
  }

  get autocompletePersons() {
    const persons = this.getPersons();

    return persons
      .filter(_u =>
        this.personSearchInput === ''
          ? true
          : _u.fullname.toLowerCase().includes(this.personSearchInput),
      )
      .sort((a, b) => (a.fullname > b.fullname ? 1 : -1));
  }

  public getPersons = () =>
    this.allAccounts.filter(
      _p =>
        this.group.members.findIndex(_m => _m._id === _p._id) < 0 &&
        this.group.owners.findIndex(_o => _o._id === _p._id) < 0 &&
        (this.group.creator ? this.group.creator._id !== _p._id : true),
    );

  public changeSearchInput = (event: Event) => {
    const value = (event.target as HTMLInputElement)?.value ?? undefined;
    if (!value) return;
    this.personSearchInput = value.toLowerCase();
  };

  public selectAutocompletePerson = (
    input: HTMLInputElement,
    event: MatAutocompleteSelectedEvent,
  ) => {
    this.group.members.push(event.option.value);
    this.searchPersonText = '';
    input.value = this.searchPersonText;
  };

  ngOnInit() {
    if (this.dialogRef && this.dialogData) {
      this.group = this.dialogData;
    }
  }

  public createEmptyGroup() {
    return {
      _id: this.objectId.generateEntityId(),
      name: '',
      creator: this.selfUserData,
      owners: new Array<IStrippedUserData>(),
      members: new Array<IStrippedUserData>(),
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

  public removePerson(id: string | ObjectId) {
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

  public drop(event: CdkDragDrop<IStrippedUserData[]>) {
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

    this.backend
      .pushGroup(this.group)
      .then(result => {
        this.isSubmitting = false;
        this.isSubmitted = true;

        lastStep.completed = true;
        stepper.next();
        stepper._steps.forEach(step => (step.editable = false));

        if (this.dialogRef) {
          this.dialogRef.close(result);
        }
      })
      .catch(e => {
        console.error(e);
        this.isSubmitting = false;
      });
  }
}
