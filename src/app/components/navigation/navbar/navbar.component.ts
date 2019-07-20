import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';

import {AccountService} from '../../../services/account.service';
import {AuthDialogComponent} from '../../auth-dialog/auth-dialog.component';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {

  @Output() public sidenavToggle = new EventEmitter();

  public isAuthenticated = false;

  constructor(
    private account: AccountService,
    private dialog: MatDialog) {
    this.account.isUserAuthenticatedObservable.subscribe(state => this.isAuthenticated = state);
  }

  ngOnInit() {
  }

  public onToggleSidenav() {
    this.sidenavToggle.emit();
  }

  public openLoginDialog() {
    this.dialog.open(AuthDialogComponent);
  }
}
