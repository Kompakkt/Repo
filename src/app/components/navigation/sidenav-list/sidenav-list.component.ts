import { Component, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';
import { AccountService, DialogHelperService } from '~services';

@Component({
  selector: 'app-sidenav-list',
  templateUrl: './sidenav-list.component.html',
  styleUrls: ['./sidenav-list.component.scss'],
})
export class SidenavListComponent {
  @Output() sidenavClose = new EventEmitter();

  constructor(
    private account: AccountService,
    public dialogHelper: DialogHelperService,
    private router: Router,
  ) {}

  get isAuthenticated$() {
    return this.account.isAuthenticated$;
  }

  get isAdmin$() {
    return this.account.isAdmin$;
  }

  public onSidenavClose = () => {
    this.sidenavClose.emit();
  };

  public logout() {
    this.account.logout().then(() => this.router.navigate(['/']));
  }
}
