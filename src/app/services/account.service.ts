import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable, of } from 'rxjs';
import { combineLatestWith, filter, map, shareReplay, switchMap } from 'rxjs/operators';

import { Collection, ICompilation, IEntity, IGroup, IUserData, UserRank } from 'src/common';
import { IUserDataWithoutData } from 'src/common/interfaces';
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
  userData$ = new BehaviorSubject<IUserDataWithoutData | undefined>(undefined);

  updateTrigger$ = new BehaviorSubject<
    'all' | Collection.entity | Collection.compilation | Collection.group
  >('all');

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

  user$ = this.userData$.pipe(filter(user => !!user));

  entities$: Observable<IEntity[]> = this.user$.pipe(
    combineLatestWith(this.updateTrigger$),
    filter(([_, trigger]) => trigger === 'all' || trigger === Collection.entity),
    switchMap(
      () => this.backend.getUserDataCollection(Collection.entity).catch(() => []) ?? of([]),
    ),
    shareReplay(1),
  );

  compilations$: Observable<ICompilation[]> = this.user$.pipe(
    combineLatestWith(this.updateTrigger$),
    filter(([_, trigger]) => trigger === 'all' || trigger === Collection.compilation),
    switchMap(
      () => this.backend.getUserDataCollection(Collection.compilation).catch(() => []) ?? of([]),
    ),
    shareReplay(1),
  );

  groups$: Observable<IGroup[]> = this.user$.pipe(
    combineLatestWith(this.updateTrigger$),
    filter(([_, trigger]) => trigger === 'all' || trigger === Collection.group),
    switchMap(() => this.backend.getUserDataCollection(Collection.group).catch(() => []) ?? of([])),
    shareReplay(1),
  );

  strippedUser$ = this.user$.pipe(
    map(user => ({
      _id: user._id,
      fullname: user.fullname,
      username: user.username,
    })),
  );

  isAuthenticated$ = this.userData$.pipe(map(user => user !== undefined));

  isAdmin$ = this.userData$.pipe(map(user => user?.role === UserRank.admin));

  // Published: finished && online && !whitelist.enabled
  publishedEntities$ = this.entities$.pipe(
    map(arr => arr.filter(e => e.finished && e.online && !e.whitelist.enabled)),
  );

  // Unpublished: finished && !online
  unpublishedEntities$ = this.entities$.pipe(map(arr => arr.filter(e => e.finished && !e.online)));

  // Restricted: finished && online && whitelist.enabled
  restrictedEntities$ = this.entities$.pipe(
    map(arr => arr.filter(e => e.finished && e.online && e.whitelist.enabled)),
  );

  // Unfinished: !finished
  unfinishedEntities$ = this.entities$.pipe(map(arr => arr.filter(e => !e.finished)));

  private setUserData(userdata?: IUserDataWithoutData) {
    this.userData$.next(userdata ?? undefined);
    return userdata;
  }

  public async loginOrFetch(data?: { username: string; password: string }) {
    const promise = data
      ? this.backend.login(data.username, data.password)
      : this.backend.isAuthorized();
    const result = await promise
      .then(userdata => this.setUserData(userdata))
      .catch(() => this.setUserData(undefined));
    this.events.updateSearchEvent();
    return result;
  }

  public async logout() {
    await this.backend.logout().catch(() => {});
    this.userData$.next(undefined);
    this.events.updateSearchEvent();
  }
}
