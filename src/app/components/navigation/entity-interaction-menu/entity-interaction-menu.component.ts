import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { EntitySettingsDialogComponent } from '../../../dialogs/entity-settings-dialog/entity-settings-dialog.component';
import { ExploreEntityDialogComponent } from '../../../dialogs/explore-entity/explore-entity-dialog.component';
import {
  isCompilation,
  isEntity,
  ICompilation,
  IEntity,
  IStrippedUserData,
  IUserData,
} from '~common/interfaces';
import { AddCompilationWizardComponent } from '../../../wizards/add-compilation/add-compilation-wizard.component';
import { AddEntityWizardComponent } from '../../../wizards/add-entity/add-entity-wizard.component';
import { ExploreCompilationDialogComponent } from '../../../dialogs/explore-compilation-dialog/explore-compilation-dialog.component';
import { EditEntityDialogComponent } from '../../../dialogs/edit-entity-dialog/edit-entity-dialog.component';

@Component({
  selector: 'app-entity-interaction-menu',
  templateUrl: './entity-interaction-menu.component.html',
  styleUrls: ['./entity-interaction-menu.component.scss'],
})
export class EntityInteractionMenuComponent {
  @Input()
  public element: ICompilation | IEntity | undefined;

  @Input()
  public entity: IEntity | undefined;

  @Input()
  public userData: IUserData | undefined;

  @Input()
  public showEdit = true;

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
      return this.userData.data.compilation.find((el: ICompilation) => el._id === id);
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

    if (isCompilation(this.element)) {
      // tslint:disable-next-line:no-non-null-assertion
      const eId = this.entity ? this.entity._id : this.element.entities[0]!._id;

      this.dialog.open(ExploreCompilationDialogComponent, {
        data: {
          collectionId: this.element._id,
          entityId: eId,
        },
        disableClose: true,
        id: 'explore-compilation-dialog',
      });
    } else {
      this.dialog.open(ExploreEntityDialogComponent, {
        data: this.element._id,
        disableClose: true,
        id: 'explore-entity-dialog',
      });
    }
  }

  public editCompilation() {
    if (!this.element || !this.isCompilation) return;
    const dialogRef = this.dialog.open(AddCompilationWizardComponent, {
      data: this.element,
      disableClose: true,
    });
    dialogRef
      .afterClosed()
      .toPromise()
      .then(_ => {
        // TODO: Success toast
      });
  }

  public editSettingsInViewer() {
    if (!this.element || !this.isEntity) return;
    this.dialog.open(EditEntityDialogComponent, {
      data: this.element,
      disableClose: true,
      id: 'edit-entity-dialog',
    });
  }

  public editMetadata() {
    if (!this.element || !this.isEntity) return;
    const dialogRef = this.dialog.open(AddEntityWizardComponent, {
      data: this.element,
      disableClose: true,
    });
    dialogRef
      .afterClosed()
      .toPromise()
      .then(_ => {
        // TODO: Success toast
      });
  }

  public editVisibility() {
    if (!this.element || !this.isEntity) return;
    const dialogRef = this.dialog.open(EntitySettingsDialogComponent, {
      data: this.element,
      disableClose: true,
    });
    dialogRef
      .afterClosed()
      .toPromise()
      .then(_ => {
        // TODO: Success toast
      });
  }
}
