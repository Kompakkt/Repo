import { Component, inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { IGroup } from 'src/common';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-group-member-dialog',
  templateUrl: './group-member-dialog.component.html',
  styleUrls: ['./group-member-dialog.component.scss'],
  imports: [MatIconModule, MatButtonModule, MatDialogModule, TranslatePipe],
})
export class GroupMemberDialogComponent implements OnInit {
  group = inject<IGroup | undefined>(MAT_DIALOG_DATA);
  #dialogRef = inject(MatDialogRef<GroupMemberDialogComponent>);

  ngOnInit() {
    if (!this.group) this.#dialogRef.close();
  }
}
