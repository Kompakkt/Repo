import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { AccountService } from 'src/app/services';

@Injectable({
  providedIn: 'root',
})
export class AuthenticatedGuard  {
  constructor(private account: AccountService) {}

  canActivate(_: ActivatedRouteSnapshot, __: RouterStateSnapshot) {
    return this.account.isAuthenticated$;
  }
}
