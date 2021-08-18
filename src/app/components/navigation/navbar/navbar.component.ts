import { Component, EventEmitter, AfterViewInit, Output, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MatProgressBar } from '@angular/material/progress-bar';
import { TranslateService } from '@ngx-translate/core';

import { AccountService, ProgressBarService, DialogHelperService } from 'src/app/services';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements AfterViewInit {
  @Output() public sidenavToggle = new EventEmitter();

  public languages = this.translate.getLangs();

  @ViewChild('progressBar')
  private progressBar: undefined | MatProgressBar;

  constructor(
    private account: AccountService,
    public translate: TranslateService,
    private progress: ProgressBarService,
    private dialog: DialogHelperService,
    private router: Router,
  ) {}

  get isAuthenticated$() {
    return this.account.isAuthenticated$;
  }

  get isAdmin$() {
    return this.account.isAdmin$;
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
