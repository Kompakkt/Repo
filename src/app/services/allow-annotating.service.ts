import { inject, Injectable } from '@angular/core';

import {
  areDocumentsEqual,
  ICompilation,
  IEntity,
  isCompilation,
  isEntity,
  IStrippedUserData,
} from 'src/common';

import { map, Observable, of, switchMap } from 'rxjs';
import { AccountService } from './';

@Injectable({
  providedIn: 'root',
})
export class AllowAnnotatingService {
  #account = inject(AccountService);

  isElementPublic(element: IEntity | ICompilation) {
    if (!element) return false;
    return !element.whitelist.enabled;
  }

  isUserOwner$(element: IEntity | ICompilation | undefined): Observable<boolean> {
    return of(element).pipe(
      switchMap(element => {
        if (isEntity(element)) {
          return this.#account.entities$;
        } else if (isCompilation(element)) {
          return this.#account.compilations$;
        } else {
          return of([]);
        }
      }),
      map(items => (element ? !!items?.find(other => areDocumentsEqual(other, element)) : false)),
    );
  }

  isUserWhitelisted$(element: IEntity | ICompilation | undefined): Observable<boolean> {
    return of(element).pipe(
      switchMap(element => (element ? this.#account.user$ : of(undefined))),
      map(userdata => {
        if (!userdata) return false;
        if (!element) return false;
        const id = userdata._id;

        const persons = element.whitelist.groups
          // Flatten group members and owners
          .map(group => group.members.concat(...group.owners))
          .reduce((acc, val) => acc.concat(val), [] as IStrippedUserData[])
          // Combine with whitelisted persons
          .concat(...element.whitelist.persons);

        return persons.some(_p => _p._id === id);
      }),
    );
  }
}
