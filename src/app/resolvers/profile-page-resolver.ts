import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';

import { IUserData } from 'src/common';

import { AccountService } from 'src/app/services';

@Injectable({
  providedIn: 'root',
})
export class ProfilePageResolver implements Resolve<IUserData | undefined> {
  constructor(private account: AccountService, private router: Router) {}

  async resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const userdata = await this.account.loginOrFetch();
    if (!userdata) {
      await this.router.navigateByUrl(this.router.getCurrentNavigation()?.initialUrl ?? '/home');
      return undefined;
    }
    return userdata;
  }
}
