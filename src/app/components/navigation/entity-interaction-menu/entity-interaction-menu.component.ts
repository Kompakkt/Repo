import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';

import {
  ICompilation,
  IEntity,
  IUserData,
  IStrippedUserData,
} from '../../../interfaces';
import { isCompilation, isEntity } from '../../../typeguards';
import { ExploreEntityDialogComponent } from '../../../dialogs/explore-entity/explore-entity-dialog.component';

@Component({
  selector: 'app-entity-interaction-menu',
  templateUrl: './entity-interaction-menu.component.html',
  styleUrls: ['./entity-interaction-menu.component.scss'],
})
export class EntityInteractionMenuComponent implements OnInit {
  @Input()
  public element: ICompilation | IEntity | undefined;

  @Input()
  public userData: IUserData | undefined;

  constructor(private dialog: MatDialog) {}

  get isEntity() {
    return isEntity(this.element);
  }

  get isCompilation() {
    return isCompilation(this.element);
  }

  get isElementPublic() {
    if (!this.element) return false;
    return !this.element.whitelist.enabled;
  }

  get isUserOwner() {
    if (!this.element) return false;
    if (!this.userData || !this.userData.data) return false;
    const id = this.element._id;

    if (isEntity(this.element) && this.userData.data.entity) {
      return this.userData.data.entity.find((el: IEntity) => el._id === id);
    }
    if (isCompilation(this.element) && this.userData.data.compilation) {
      return this.userData.data.compilation.find(
        (el: ICompilation) => el._id === id,
      );
    }
    return false;
  }

  get isUserWhitelisted() {
    if (!this.element) return false;
    if (!this.userData) return false;
    const id = this.userData._id;

    const persons = this.element.whitelist.groups
      // Flatten group members and owners
      .map(group => group.members.concat(...group.owners))
      .reduce((acc, val) => acc.concat(val), [] as IStrippedUserData[])
      // Combine with whitelisted persons
      .concat(...this.element.whitelist.persons);

    return persons.find(_p => _p._id === id);
  }

  public explore() {
    if (!this.element) return;
    const dialogRef = this.dialog.open(ExploreEntityDialogComponent, {
      data: this.element._id,
      disableClose: true,
      id: 'explore-entity-dialog',
    });
  }

  public edit() {
    if (!this.element) return;
    if (this.isEntity) {
      // TODO: Cases
      // - viewer settings
      // - entity visibility settings
      // - metadata
    }
    if (this.isCompilation) {
      // edit compilation wizard
    }
  }

  ngOnInit() {}
}
