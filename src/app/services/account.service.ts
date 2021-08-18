import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map, filter } from 'rxjs/operators';

import {
  IUserData,
  IEntity,
  isResolvedEntity,
  isEntity,
  UserRank,
} from 'src/common';

import { EventsService } from './events.service';
import { BackendService } from './backend.service';
import { SnackbarService } from './snackbar.service';

const cleanUser = (user: IUserData) => {
  for (const prop in user.data) {
    user.data[prop] = user.data[prop].filter(e => e);
  }
  return user;
};

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  private userDataSubject = new BehaviorSubject<IUserData | undefined>(
    undefined,
  );
  public userData$ = this.userDataSubject.asObservable();

  constructor(
    private backend: BackendService,
    private snackbar: SnackbarService,
    private events: EventsService,
  ) {
    this.userData$.subscribe(changes =>
      console.log('Userdata changed:', changes),
    );

    combineLatest(this.user$, this.unpublishedEntities$).subscribe(
      ([user, unpublishedEntities]) => {
        let message = `Logged in as ${user.fullname}`;
        const unpublished = unpublishedEntities.length;
        if (unpublished > 0) {
          const plural = unpublished === 1 ? '' : 's';
          message += `\nYou have ${unpublished} unpublished object${plural}`;
          message += `\nVisit your profile to work on your unpublished object${plural}`;
        }
        this.snackbar.showMessage(message, 5);
      },
    );
  }

  // Published: finished && online && !whitelist.enabled
  get publishedEntities$() {
    return this.entities$.pipe(
      map(arr =>
        arr.filter(e => e.finished && e.online && !e.whitelist.enabled),
      ),
    );
  }

  // Unpublished: finished && !online
  get unpublishedEntities$() {
    return this.entities$.pipe(
      map(arr => arr.filter(e => e.finished && !e.online)),
    );
  }

  // Restricted: finished && online && whitelist.enabled
  get restrictedEntities$() {
    return this.entities$.pipe(
      map(arr =>
        arr.filter(e => e.finished && e.online && e.whitelist.enabled),
      ),
    );
  }

  // Unfinished: !finished
  get unfinishedEntities$() {
    return this.entities$.pipe(map(arr => arr.filter(e => !e.finished)));
  }

  get entities$() {
    return this.user$.pipe(map(user => user.data.entity.filter(isEntity)));
  }

  get user$() {
    return this.userData$.pipe(
      filter(user => !!user),
      map(user => user as IUserData),
    );
  }

  get strippedUser$() {
    return this.user$.pipe(
      map(user => ({
        _id: user._id,
        fullname: user.fullname,
        username: user.username,
      })),
    );
  }

  get isAuthenticated$() {
    return this.userData$.pipe(map(user => user !== undefined));
  }

  get isAdmin$() {
    return this.userData$.pipe(map(user => user?.role === UserRank.admin));
  }

  public fetchUserData() {
    return this.backend
      .isAuthorized()
      .then(userdata => {
        this.userDataSubject.next(cleanUser(userdata));
        return userdata;
      })
      .catch(() => {
        this.userDataSubject.next(undefined);
        return undefined;
      });
  }

  public async attemptLogin(
    username: string,
    password: string,
  ): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.backend
        .login(username, password)
        .then(userdata => this.userDataSubject.next(cleanUser(userdata)))
        .then(() => resolve(true))
        .catch(err => {
          console.error(err);
          this.userDataSubject.next(undefined);
          reject(false);
        });
    });
  }

  public logout() {
    return this.backend
      .logout()
      .then(() => {
        this.events.updateSearchEvent();
      })
      .catch(err => console.error(err))
      .then(() => {
        this.userDataSubject.next(undefined);
      });
  }
}
