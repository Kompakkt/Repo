import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

import { IEntity, IUserData } from '../../../interfaces';
import { MongoHandlerService } from '../../../services/mongo-handler.service';

@Component({
  selector: 'app-entity-rights-dialog',
  templateUrl: './entity-rights-dialog.component.html',
  styleUrls: ['./entity-rights-dialog.component.scss'],
})
export class EntityRightsDialogComponent implements OnInit {
  public entity: IEntity | undefined;

  public entityOwners: IUserData[] = [];

  constructor(
    private dialogRef: MatDialogRef<EntityRightsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private data: IEntity | undefined,
    private mongo: MongoHandlerService,
  ) {}

  ngOnInit() {
    if (this.data) {
      this.entity = this.data;
      this.mongo
        .findEntityOwners(this.entity._id)
        .then(result => {
          if (result.status === 'ok') {
            this.entityOwners = result.accounts;
          } else {
            throw new Error(result.message);
          }
        })
        .catch(e => console.error(e));
    }
  }
}
