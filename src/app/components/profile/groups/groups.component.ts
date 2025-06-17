import { AsyncPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
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
import { MatTooltip } from '@angular/material/tooltip';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import DeepClone from 'rfdc';
import { map } from 'rxjs';
import { ConfirmationDialogComponent, GroupMemberDialogComponent } from 'src/app/dialogs';
import { TranslatePipe } from 'src/app/pipes';
import { AccountService, BackendService, DialogHelperService } from 'src/app/services';
import { AddGroupWizardComponent } from 'src/app/wizards';
import { Collection, IGroup, isGroup } from 'src/common';
import { IUserDataWithoutData } from 'src/common/interfaces';
const deepClone = DeepClone({ circles: true });

@Component({
  selector: 'app-components-profile-groups',
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.scss'],
  standalone: true,
  imports: [
    MatExpansionModule,
    MatChipsModule,
    MatTooltip,
    MatMenuModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    MatSlideToggleModule,
    FormsModule,
    TranslatePipe,
    AsyncPipe,
  ],
})
export class GroupsComponent implements OnInit {
  public userData: IUserDataWithoutData;

  public showPartakingGroups = false;
  private __partakingGroups: IGroup[] = [];

  constructor(
    private translatePipe: TranslatePipe,
    private account: AccountService,
    private dialog: MatDialog,
    private backend: BackendService,
    private helper: DialogHelperService,
    private titleService: Title,
    private route: ActivatedRoute,
  ) {
    this.userData = this.route.snapshot.data.userData;

    this.account.user$.subscribe(newData => {
      this.userData = newData;
      if (!this.userData) return;
      this.backend
        .findUserInGroups()
        .then(groups => (this.__partakingGroups = groups))
        .catch(e => console.error(e));
    });
  }

  userGroups$ = this.account.groups$.pipe(map(groups => groups.filter(isGroup)));

  get partakingGroups(): IGroup[] {
    return this.__partakingGroups;
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

  public leaveGroupDialog(group: IGroup) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: `Do you really want to leave ${group.name}?`,
    });
    dialogRef
      .afterClosed()
      .toPromise()
      .then(result => {
        if (result) {
          // TODO: leave
          console.log('Leave', group);
        }
      });
  }

  ngOnInit() {
    this.titleService.setTitle('Kompakkt – Profile');
  }
}
