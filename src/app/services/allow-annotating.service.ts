import { Injectable } from '@angular/core';

import {
  ICompilation,
  IEntity,
  IUserData,
  IStrippedUserData,
} from '../interfaces';
import { isCompilation, isEntity } from '../typeguards';

import { AccountService } from './account.service';

@Injectable({
  providedIn: 'root',
})
export class AllowAnnotatingService {
  private userData: IUserData | undefined;

  constructor(private account: AccountService) {
    this.account.userDataObservable.subscribe(newData => {
      if (!newData) return;
      this.userData = newData;
    });
  }

  public isElementPublic(element: IEntity | ICompilation) {
    if (!element) return false;
    return !element.whitelist.enabled;
  }

  public isUserOwner(element: IEntity | ICompilation) {
    if (!element) return false;
    if (!this.userData || !this.userData.data) return false;
    const id = element._id;

    if (isEntity(element) && this.userData.data.entity) {
      return (
        this.userData.data.entity.find((el: IEntity) => el._id === id) !==
        undefined
      );
    }
    if (isCompilation(element) && this.userData.data.compilation) {
      return (
        this.userData.data.compilation.find(
          (el: ICompilation) => el._id === id,
        ) !== undefined
      );
    }
    return false;
  }

  public isUserWhitelisted(element: IEntity | ICompilation) {
    if (!element) return false;
    if (!this.userData) return false;
    const id = this.userData._id;

    const persons = element.whitelist.groups
      // Flatten group members and owners
      .map(group => group.members.concat(...group.owners))
      .reduce((acc, val) => acc.concat(val), [] as IStrippedUserData[])
      // Combine with whitelisted persons
      .concat(...element.whitelist.persons);

    return persons.find(_p => _p._id === id);
  }
}
