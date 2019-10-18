import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';

import { AccountService } from './account.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuardService implements CanActivate {
  constructor(private account: AccountService, private router: Router) {}

  async canActivate() {
    const result = await this.account
      .checkIsAuthorized()
      .then(isAuthorized => isAuthorized)
      .catch(_ => false);
    if (!result) {
      this.router.navigate(['home']);
      return false;
    }
    return true;
  }
}
