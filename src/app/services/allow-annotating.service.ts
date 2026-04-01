import { inject, Injectable } from '@angular/core';

import {
  areDocumentsEqual,
  EntityAccessRole,
  ICompilation,
  IEntity,
  isCompilation,
  isEntity,
  IStrippedUserData,
} from '@kompakkt/common';

import { map, Observable, of, switchMap } from 'rxjs';
import { AccountService } from './';

@Injectable({
  providedIn: 'root',
})
export class AllowAnnotatingService {
  #account = inject(AccountService);

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

  userHasAccess$(
    element: IEntity | ICompilation | undefined,
    role: EntityAccessRole,
  ): Observable<boolean> {
    return of(element).pipe(
      switchMap(() => this.#account.user$),
      map(user => {
        if (!element) return false;
        return element.access.find(u => u._id === user?._id)?.role === role;
      }),
    );
  }
}
