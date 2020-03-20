import { Injectable } from '@angular/core';
import {
  Resolve,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from '@angular/router';

import { IUserData } from '@kompakkt/shared';

import { AccountService } from '../services/account.service';

@Injectable({
  providedIn: 'root',
})
export class ProfilePageResolver implements Resolve<IUserData> {
  constructor(private account: AccountService, private router: Router) {}

  async resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const userdata = await this.account.fetchUserData();
    if (!userdata) {
      await this.router.navigateByUrl(
        this.router.getCurrentNavigation()?.initialUrl ?? '/home',
      );
      return (undefined as unknown) as IUserData;
    }
    return userdata;
  }
}
