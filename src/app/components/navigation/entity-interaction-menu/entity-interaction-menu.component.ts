import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';

import { ExploreEntityDialogComponent } from '../../../dialogs/explore-entity/explore-entity-dialog.component';

@Component({
  selector: 'app-entity-interaction-menu',
  templateUrl: './entity-interaction-menu.component.html',
  styleUrls: ['./entity-interaction-menu.component.scss'],
})
export class EntityInteractionMenuComponent implements OnInit {
  @Input()
  id;

  constructor(private dialog: MatDialog) {}

  public explore() {
    const dialogRef = this.dialog.open(ExploreEntityDialogComponent, {
      data: this.id,
      disableClose: true,
      id: 'explore-entity-dialog',
    });
  }

  ngOnInit() {}
}
