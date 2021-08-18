import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot } from '@angular/router';

import { AccountService } from '../services';

@Injectable({
  providedIn: 'root',
})
export class AuthenticatedGuard implements CanActivate {
  constructor(private account: AccountService) {}

  canActivate(_: ActivatedRouteSnapshot, __: RouterStateSnapshot) {
    return this.account.isAuthenticated$;
  }
}
