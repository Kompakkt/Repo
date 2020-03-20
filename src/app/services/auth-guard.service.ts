import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';

import { AccountService } from './account.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuardService implements CanActivate {
  constructor(private account: AccountService, private router: Router) {}

  async canActivate() {
    return await this.account.isUserAuthenticatedObservable
      .toPromise()
      .then(isAuthenticated => {
        console.log(isAuthenticated);
        if (!isAuthenticated) {
          this.router.navigate(['home']);
          return false;
        }
        return true;
      });
  }
}
