import { Component, Input } from '@angular/core';
import { IGroup } from '~common/interfaces';
import { combineLatest, map, ReplaySubject } from 'rxjs';
import { AccountService } from '~services';
import { GroupMemberDialogComponent } from '~dialogs';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-group-element',
  templateUrl: './group-element.component.html',
  styleUrls: ['./group-element.component.scss'],
})
export class GroupElementComponent {
  @Input('group') set group(group: IGroup) {
    this.group$.next(group);
  }

  public group$ = new ReplaySubject<IGroup>(1);
  public isUserOwner$ = combineLatest([this.group$, this.account.user$]).pipe(
    map(([group, user]) => group?.creator._id === user._id),
  );

  public openMemberList(group: IGroup) {
    this.dialog.open(GroupMemberDialogComponent, { data: group });
  }

  constructor(private account: AccountService, private dialog: MatDialog) {}
}
