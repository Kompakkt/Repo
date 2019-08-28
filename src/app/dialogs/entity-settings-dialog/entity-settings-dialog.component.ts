import { Component, OnInit, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatInput,
  MatAutocompleteSelectedEvent,
  MatDialogRef,
} from '@angular/material';

import { IEntity, IStrippedUserData, IGroup } from '../../interfaces';
import { MongoHandlerService } from '../../services/mongo-handler.service';

@Component({
  selector: 'app-entity-settings-dialog',
  templateUrl: './entity-settings-dialog.component.html',
  styleUrls: ['./entity-settings-dialog.component.scss'],
})
export class EntitySettingsDialogComponent implements OnInit {
  public entity: IEntity | undefined;

  private allAccounts: IStrippedUserData[] = [];
  private allGroups: IGroup[] = [];

  public errorMessages: string[] = [];

  public searchPersonText = '';
  public searchGroupText = '';

  public isSubmitting = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private mongo: MongoHandlerService,
    private dialogRef: MatDialogRef<EntitySettingsDialogComponent>,
  ) {
    this.mongo
      .getAccounts()
      .then(accounts => (this.allAccounts = accounts))
      .catch(e => {
        console.error(e);
        this.errorMessages.push('Failed retrieving users');
      });
    this.mongo
      .getGroups()
      .then(groups => (this.allGroups = groups))
      .catch(e => {
        console.error(e);
        this.errorMessages.push('Failed retrieving groups');
      });
  }

  public getPersons() {
    return this.allAccounts.filter(_p =>
      this.entity ? this.entity.whitelist.persons.indexOf(_p) < 0 : false,
    );
  }

  public getGroups() {
    return this.allGroups.filter(_g =>
      this.entity ? this.entity.whitelist.groups.indexOf(_g) < 0 : false,
    );
  }

  public removePerson(person: IStrippedUserData) {
    if (this.entity) {
      this.entity.whitelist.persons = this.entity.whitelist.persons.filter(
        _p => _p._id !== person._id,
      );
    }
  }

  public removeGroup(group: IGroup) {
    if (this.entity) {
      this.entity.whitelist.groups = this.entity.whitelist.groups.filter(
        _g => _g._id !== group._id,
      );
    }
  }

  public selectAutocompletePerson = (
    input: MatInput,
    event: MatAutocompleteSelectedEvent,
  ) => {
    if (this.entity) {
      this.entity.whitelist.persons.push(event.option.value);
      this.searchPersonText = '';
      input.value = this.searchPersonText;
    }
  };

  public selectAutocompleteGroup = (
    input: MatInput,
    event: MatAutocompleteSelectedEvent,
  ) => {
    if (this.entity) {
      this.entity.whitelist.groups.push(event.option.value);
      this.searchGroupText = '';
      input.value = this.searchGroupText;
    }
  };

  ngOnInit() {
    if (this.data) {
      this.entity = this.data as IEntity;
      console.log(this.entity);
    }
  }

  public cancel() {
    this.dialogRef.close(false);
  }

  public submit() {
    if (this.entity) {
      this.dialogRef.disableClose = true;
      this.isSubmitting = true;
      this.mongo
        .pushEntity(this.entity)
        .then(result => {
          this.dialogRef.close(this.entity);
        })
        .catch(e => {
          console.error(e);
        });
    }
  }
}
