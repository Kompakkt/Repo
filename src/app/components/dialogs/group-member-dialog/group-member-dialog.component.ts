import { Component, OnInit, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatInput,
  MatAutocompleteSelectedEvent,
  MatDialogRef,
} from '@angular/material';

import { IGroup } from '../../../interfaces';

@Component({
  selector: 'app-group-member-dialog',
  templateUrl: './group-member-dialog.component.html',
  styleUrls: ['./group-member-dialog.component.scss'],
})
export class GroupMemberDialogComponent implements OnInit {
  public group: IGroup | undefined;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: IGroup | undefined,
    private dialogRef: MatDialogRef<GroupMemberDialogComponent>,
  ) {}

  ngOnInit() {
    if (this.data) {
      this.group = this.data;
    } else {
      this.dialogRef.close();
    }
  }
}
