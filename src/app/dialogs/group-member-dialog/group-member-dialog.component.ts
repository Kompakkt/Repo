import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import {
  MatExpansionPanel,
  MatExpansionPanelDescription,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle,
} from '@angular/material/expansion';
import { MatList, MatListItem } from '@angular/material/list';
import { IGroup } from 'src/common';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-group-member-dialog',
  templateUrl: './group-member-dialog.component.html',
  styleUrls: ['./group-member-dialog.component.scss'],
  standalone: true,
  imports: [
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    MatExpansionPanelDescription,
    MatList,
    MatListItem,
    TranslatePipe,
  ],
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
