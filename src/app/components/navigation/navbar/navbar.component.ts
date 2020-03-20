import {
  Component,
  EventEmitter,
  AfterViewInit,
  Output,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { MatProgressBar } from '@angular/material/progress-bar';
import { TranslateService } from '@ngx-translate/core';

import { AccountService } from '../../../services/account.service';
import { ProgressBarService } from '../../../services/progress-bar.service';
import { DialogHelperService } from '../../../services/dialog-helper.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements AfterViewInit {
  @Output() public sidenavToggle = new EventEmitter();

  public isAuthenticated;
  public isAdmin;
  public languages;

  @ViewChild('progressBar')
  private progressBar: undefined | MatProgressBar;

  constructor(
    private account: AccountService,
    public translate: TranslateService,
    private progress: ProgressBarService,
    private dialog: DialogHelperService,
    private router: Router,
  ) {
    this.isAuthenticated = false;
    this.languages = this.translate.getLangs();
    this.account.isUserAuthenticatedObservable.subscribe(
      state => (this.isAuthenticated = state),
    );
    this.account.userDataObservable.subscribe(
      userdata =>
        (this.isAdmin = userdata && userdata.role && userdata.role === 'admin'),
    );
  }

  ngAfterViewInit() {
    if (this.progressBar) {
      this.progress.setProgressBar(this.progressBar);
    }
  }

  public logout() {
    this.account.logout().then(() => this.router.navigate(['/']));
  }

  public onToggleSidenav() {
    this.sidenavToggle.emit();
  }

  public openLoginDialog() {
    this.dialog.openLoginDialog();
  }

  public openRegisterDialog() {
    this.dialog.openRegisterDialog();
  }
}
