import { inject, Injectable } from '@angular/core';

import {
  ICompilation,
  IEntity,
  IStrippedUserData,
  IUserData,
  areDocumentsEqual,
  isCompilation,
  isEntity,
} from 'src/common';

import { AccountService } from './';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root',
})
export class AllowAnnotatingService {
  #account = inject(AccountService);

  public isElementPublic(element: IEntity | ICompilation) {
    if (!element) return false;
    return !element.whitelist.enabled;
  }

  public async isUserOwner(element: IEntity | ICompilation) {
    if (!element) return false;

    if (isEntity(element)) {
      const entities = await firstValueFrom(this.#account.entities$);
      const result = !!entities?.find(other => areDocumentsEqual(other, element));
      return result;
    }
    if (isCompilation(element)) {
      const compilations = await firstValueFrom(this.#account.compilations$);
      const result = !!compilations?.find(other => areDocumentsEqual(other, element));
      return result;
    }
    return false;
  }

  public async isUserWhitelisted(element: IEntity | ICompilation) {
    if (!element) return false;
    const userdata = await firstValueFrom(this.#account.userData$);
    if (!userdata) return false;
    const id = userdata._id;

    const persons = element.whitelist.groups
      // Flatten group members and owners
      .map(group => group.members.concat(...group.owners))
      .reduce((acc, val) => acc.concat(val), [] as IStrippedUserData[])
      // Combine with whitelisted persons
      .concat(...element.whitelist.persons);

    return persons.find(_p => _p._id === id);
  }
}
