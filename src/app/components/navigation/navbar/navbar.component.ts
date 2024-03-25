import { Component, EventEmitter, AfterViewInit, Output, ViewChild } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatProgressBar } from '@angular/material/progress-bar';

import { AccountService, ProgressBarService, DialogHelperService } from 'src/app/services';
import { TranslateService } from '../../../services/translate.service';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { AsyncPipe } from '@angular/common';
import { MatToolbar } from '@angular/material/toolbar';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  standalone: true,
  imports: [
    MatToolbar,
    RouterLink,
    RouterLinkActive,
    MatIconButton,
    MatIcon,
    MatProgressBar,
    AsyncPipe,
    TranslatePipe,
  ],
})
export class NavbarComponent implements AfterViewInit {
  @Output() public sidenavToggle = new EventEmitter();

  @ViewChild('progressBar')
  private progressBar: undefined | MatProgressBar;

  constructor(
    private account: AccountService,
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
