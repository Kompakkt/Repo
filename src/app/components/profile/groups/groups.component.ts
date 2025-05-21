import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatCard, MatCardActions, MatCardSubtitle, MatCardTitle } from '@angular/material/card';
import { MatChipListbox, MatChipOption } from '@angular/material/chips';
import { MatDivider } from '@angular/material/divider';
import {
  MatExpansionPanel,
  MatExpansionPanelActionRow,
  MatExpansionPanelContent,
  MatExpansionPanelDescription,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle,
} from '@angular/material/expansion';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { MatTooltip } from '@angular/material/tooltip';
import {
  ConfirmationDialogComponent,
  GroupMemberDialogComponent,
} from 'src/app/dialogs';
import { TranslatePipe } from 'src/app/pipes';
import { AccountService, BackendService, DialogHelperService } from 'src/app/services';
import {
  AddGroupWizardComponent,
} from 'src/app/wizards';
import {
  IGroup,
  IUserData,
  isGroup,
} from 'src/common';
import { TranslatePipe as TranslatePipe_1 } from 'src/app/pipes/translate.pipe';

@Component({
  selector: 'app-components-profile-groups',
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.scss'],
  standalone: true,
  imports: [
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    MatExpansionPanelDescription,
    MatExpansionPanelContent,
    MatChipListbox,
    MatChipOption,
    MatTooltip,
    MatIconButton,
    MatMenuTrigger,
    MatIcon,
    MatMenu,
    MatMenuItem,
    MatCard,
    MatCardTitle,
    MatCardSubtitle,
    MatCardActions,
    MatExpansionPanelActionRow,
    MatButton,
    MatDivider,
    MatSlideToggle,
    FormsModule,
    TranslatePipe_1,  
  ],
})

export class GroupsComponent implements OnInit {
    public userData: IUserData;

    public showPartakingGroups = false;
    private __partakingGroups: IGroup[] = [];

    public filter = {
        published: true,
        unpublished: false,
        restricted: false,
        unfinished: false,
      };

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
          this.updateFilter();
        });
      }

    // Groups
  get userGroups(): IGroup[] {
    return this.userData?.data?.group?.filter(group => isGroup(group)) ?? [];
  }

  get partakingGroups(): IGroup[] {
    return this.__partakingGroups;
  }

  public openGroupCreation(group?: IGroup) {
    const dialogRef = this.dialog.open(AddGroupWizardComponent, {
      data: group ? group : undefined,
      disableClose: true,
    });
    dialogRef
      .afterClosed()
      .toPromise()
      .then((result: undefined | IGroup) => {
        if (!result) return;
        if (!this.userData) return;
        // Add new group to list
        this.userData.data.group = this.userData.data.group
          ? [...this.userData.data.group, result]
          : [result];
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
        if (this.userData?.data?.group) {
          this.userData.data.group = (this.userData.data.group as IGroup[]).filter(
            _g => _g._id !== group._id,
          );
        }
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

  public async updateFilter(property?: string, paginator?: MatPaginator) {
    // On radio button change
    if (property) {
      // Disable wrong filters
      for (const prop in this.filter) {
        (this.filter as any)[prop] = prop === property;
      }
    }

    if (paginator) paginator.firstPage();
  }
  
  ngOnInit() {
    this.titleService.setTitle('Kompakkt – Profile');
  }
}

