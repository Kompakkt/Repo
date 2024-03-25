import { Component, Inject, OnInit } from '@angular/core';
import {
  MatAutocomplete,
  MatAutocompleteSelectedEvent,
  MatAutocompleteTrigger,
} from '@angular/material/autocomplete';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { FormsModule } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatOption } from '@angular/material/core';
import { MatFormField } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatList, MatListItem } from '@angular/material/list';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { MatTab, MatTabGroup } from '@angular/material/tabs';
import { BackendService } from 'src/app/services';
import { IEntity, IGroup, IStrippedUserData } from 'src/common';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-entity-settings-dialog',
  templateUrl: './entity-settings-dialog.component.html',
  styleUrls: ['./entity-settings-dialog.component.scss'],
  standalone: true,
  imports: [
    MatSlideToggle,
    FormsModule,
    MatList,
    MatListItem,
    MatTabGroup,
    MatTab,
    MatFormField,
    MatInput,
    MatAutocompleteTrigger,
    MatAutocomplete,
    MatOption,
    MatIconButton,
    MatIcon,
    MatButton,
    TranslatePipe,
  ],
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
    private backend: BackendService,
    private dialogRef: MatDialogRef<EntitySettingsDialogComponent>,
  ) {
    this.backend
      .getAccounts()
      .then(accounts => (this.allAccounts = accounts))
      .catch(e => {
        console.error(e);
        this.errorMessages.push('Failed retrieving users');
      });
    this.backend
      .getGroups()
      .then(groups => (this.allGroups = groups))
      .catch(e => {
        console.error(e);
        this.errorMessages.push('Failed retrieving groups');
      });
  }

  get persons() {
    return this.allAccounts.filter(_p =>
      this.entity ? this.entity.whitelist.persons.indexOf(_p) < 0 : false,
    );
  }

  get groups() {
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
    input: HTMLInputElement,
    event: MatAutocompleteSelectedEvent,
  ) => {
    if (this.entity) {
      this.entity.whitelist.persons.push(event.option.value);
      this.searchPersonText = '';
      input.value = this.searchPersonText;
    }
  };

  public selectAutocompleteGroup = (
    input: HTMLInputElement,
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
      this.backend
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
