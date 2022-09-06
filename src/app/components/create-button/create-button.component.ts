import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom, map } from 'rxjs';
import { ICompilation, IEntity } from '~common/interfaces';
import { ConfirmationDialogComponent, UploadApplicationDialogComponent } from '~dialogs';
import { AccountService, DialogHelperService } from '~services';
import { AddCompilationWizardComponent, AddEntityWizardComponent } from '~wizards';

@Component({
  selector: 'app-create-button',
  templateUrl: './create-button.component.html',
  styleUrls: ['./create-button.component.scss'],
})
export class CreateButtonComponent implements OnInit {
  constructor(
    private dialog: MatDialog,
    private account: AccountService,
    private helper: DialogHelperService,
  ) {}

  get isLoggedIn$() {
    return this.account.isAuthenticated$;
  }

  get role$() {
    return this.account.user$.pipe(map(user => user.role));
  }

  public async createEntity() {
    const ref = this.dialog.open<AddEntityWizardComponent, any, IEntity | undefined>(
      AddEntityWizardComponent,
      { disableClose: true },
    );
    const result = await firstValueFrom(ref.afterClosed());
    if (!result) return;
    await this.account.loginOrFetch();
  }

  public async createCompilation() {
    const ref = this.dialog.open<AddCompilationWizardComponent, any, ICompilation | undefined>(
      AddCompilationWizardComponent,
      { disableClose: true },
    );
    const result = await firstValueFrom(ref.afterClosed());
    if (!result) return;
    await this.account.loginOrFetch();
  }

  public async uploadApplication() {
    const userdata = await firstValueFrom(this.account.userData$);
    if (!userdata) return;
    const ref = this.dialog.open(UploadApplicationDialogComponent, {
      data: userdata,
      disableClose: true,
    });
    ref.backdropClick().subscribe(async () => {
      const confirm = await this.helper.confirm('Do you want to cancel your application?');
      if (confirm) ref.close();
    });
  }

  ngOnInit(): void {}
}
