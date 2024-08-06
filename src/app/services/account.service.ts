import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { IUserData, UserRank, isEntity } from 'src/common';
import { BackendService, EventsService, SnackbarService } from './';

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
  private userData = new BehaviorSubject<IUserData | undefined>(undefined);
  public userData$ = this.userData.asObservable();

  constructor(
    private backend: BackendService,
    private snackbar: SnackbarService,
    private events: EventsService,
  ) {
    this.userData$.subscribe(changes => console.log('Userdata changed:', changes));

    combineLatest([this.user$, this.unpublishedEntities$]).subscribe(
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
      map(arr => arr.filter(e => e.finished && e.online && !e.whitelist.enabled)),
    );
  }

  // Unpublished: finished && !online
  get unpublishedEntities$() {
    return this.entities$.pipe(map(arr => arr.filter(e => e.finished && !e.online)));
  }

  // Restricted: finished && online && whitelist.enabled
  get restrictedEntities$() {
    return this.entities$.pipe(
      map(arr => arr.filter(e => e.finished && e.online && e.whitelist.enabled)),
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

  private setUserData(userdata?: IUserData) {
    this.userData.next(userdata ?? undefined);
    return userdata;
  }

  public async loginOrFetch(data?: { username: string; password: string }) {
    const promise = data
      ? this.backend.login(data.username, data.password)
      : this.backend.isAuthorized();
    const result = await promise
      .then(userdata => this.setUserData(userdata))
      .catch(userdata => this.setUserData(userdata));
    this.events.updateSearchEvent();
    return result;
  }

  public async logout() {
    await this.backend.logout().catch(() => {});
    this.userData.next(undefined);
    this.events.updateSearchEvent();
  }
}
