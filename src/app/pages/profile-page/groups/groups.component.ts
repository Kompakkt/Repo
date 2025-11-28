import { AsyncPipe } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import DeepClone from 'rfdc';
import { filter, firstValueFrom, map, merge, switchMap } from 'rxjs';
import { GridElementComponent } from 'src/app/components';
import { ConfirmationDialogComponent, GroupMemberDialogComponent } from 'src/app/dialogs';
import { TranslatePipe } from 'src/app/pipes';
import { AccountService, BackendService, DialogHelperService } from 'src/app/services';
import { AddGroupWizardComponent } from 'src/app/wizards';
import { Collection, IGroup, isGroup } from 'src/common';
import { TooltipDirective } from 'komponents';
import { MatTooltip } from '@angular/material/tooltip';
const deepClone = DeepClone({ circles: true });

@Component({
  selector: 'app-profile-groups',
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.scss'],
  standalone: true,
  imports: [
    MatExpansionModule,
    MatChipsModule,
    MatMenuModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    MatSlideToggleModule,
    FormsModule,
    TranslatePipe,
    AsyncPipe,
    GridElementComponent,
    MatTooltip,
  ],
})
export class ProfileGroupsComponent {
  constructor(
    private account: AccountService,
    private dialog: MatDialog,
    private backend: BackendService,
    private helper: DialogHelperService,
  ) {}

  private refresh$ = merge(
    this.account.user$,
    this.account.updateTrigger$.pipe(filter(t => t === Collection.group)),
  );

  userGroups$ = this.refresh$.pipe(switchMap(() => this.backend.findUserInGroups()));
  user = toSignal(this.account.user$);

  private getUserGroupStatus(group: IGroup): { isOwner: boolean; isCreator: boolean } {
    const currentUser = this.user();
    if (!currentUser) return { isOwner: false, isCreator: false };

    const isOwner = group.owners.some(owner => owner._id === currentUser._id);
    const isCreator = group.creator._id === currentUser._id;

    return { isOwner, isCreator };
  }

  public selfIsLastOwner(group): boolean {
    const { isOwner } = this.getUserGroupStatus(group);
    return isOwner && group.owners.length === 1;
  }

  public userCanEdit(group: IGroup): boolean {
    const { isOwner, isCreator } = this.getUserGroupStatus(group);
    return isOwner || isCreator;
  }

  public openGroupCreation(group?: IGroup) {
    const dialogRef = this.dialog.open(AddGroupWizardComponent, {
      data: group ? deepClone(group) : undefined,
      disableClose: true,
    });
    dialogRef
      .afterClosed()
      .toPromise()
      .then((result: undefined | IGroup) => {
        this.account.updateTrigger$.next(Collection.group);
      });
  }

  public openMemberList(group: IGroup) {
    this.dialog.open(GroupMemberDialogComponent, {
      data: group,
    });
  }

  public async removeGroupDialog(group: IGroup) {
    const loginData = await this.helper.confirmWithAuth(
      `Do you really want to delete ${group.name}?`,
      `Validate login before deleting ${group.name}`,
    );
    if (!loginData) return;
    const { username, password } = loginData;

    this.backend
      .deleteRequest(group._id, 'group', username, password)
      .then(result => {
        this.account.updateTrigger$.next(Collection.group);
      })
      .catch(e => console.error(e));
  }

  public async leaveGroupDialog(group: IGroup) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: `Do you really want to leave ${group.name}?`,
    });

    const response = await firstValueFrom(dialogRef.afterClosed());
    if (!response) return;

    this.backend.leaveGroup(group._id).then(result => {
      console.log('Left', group);
      this.account.updateTrigger$.next(Collection.group);
    });
  }
}
