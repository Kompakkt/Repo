import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';

import { AccountService } from 'src/app/services';

@Injectable({
  providedIn: 'root',
})
export class ProfilePageResolver {
  constructor(
    private account: AccountService,
    private router: Router,
  ) {}

  async resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const userdata = await this.account.loginOrFetch();
    if (!userdata) {
      await this.router.navigateByUrl(this.router.getCurrentNavigation()?.initialUrl ?? '/home');
      return undefined;
    }
    return userdata;
  }
}
