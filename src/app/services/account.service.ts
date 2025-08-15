import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, firstValueFrom, from, Observable, of } from 'rxjs';
import { catchError, combineLatestWith, filter, map, shareReplay, switchMap } from 'rxjs/operators';

import { Collection, ICompilation, IEntity, IGroup, ProfileType, UserRank } from 'src/common';
import { IAnnotation, IPublicProfile, IStrippedUserData, IUserDataWithoutData } from 'src/common/interfaces';
import { BackendService, EventsService, SnackbarService } from './';

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  isWaitingForLogin$ = new BehaviorSubject<boolean>(false);
  userData$ = new BehaviorSubject<IUserDataWithoutData | undefined>(undefined);

  updateTrigger$ = new BehaviorSubject<'all' | Collection | 'profile'>('all');

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

  profiles$ = this.user$.pipe(
    combineLatestWith(this.updateTrigger$),
    filter(([_, trigger]) => trigger === 'all' || trigger === 'profile'),
    switchMap(([user]) => {
      const profileIds = Object.keys(user.profiles ?? {});
      const promises = profileIds.map(id => this.backend.getProfileByIdOrName(id));
      return Promise.all(promises);
    }),
    map(profiles => profiles.filter(profile => !!profile) as IPublicProfile[]),
    shareReplay(1),
  );

  userProfile$ = this.profiles$.pipe(
    map(profiles => profiles.find(profile => profile.type === ProfileType.user)),
  );

  institutionProfiles$ = this.profiles$.pipe(
    map(profiles => profiles.filter(profile => profile.type === ProfileType.institution)),
  );

  entities$: Observable<IEntity[]> = this.user$.pipe(
    combineLatestWith(this.updateTrigger$),
    filter(([_, trigger]) => trigger === 'all' || trigger === Collection.entity),
    switchMap(() => from(this.fetchProfileEntities()).pipe(catchError(() => of([])))),
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

  annotations$: Observable<IAnnotation[]> = this.user$.pipe(
    combineLatestWith(this.updateTrigger$),
    filter(([_, trigger]) => trigger === Collection.annotation),
    switchMap(
      () => this.backend.getUserDataCollection(Collection.annotation).catch(() => []) ?? of([]),
    ),
    shareReplay(1),
  );

  strippedUser$ = this.user$.pipe(
    map(
      user =>
        ({
          _id: user._id,
          fullname: user.fullname,
          username: user.username,
        }) as IStrippedUserData,
    ),
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

  private async fetchProfileEntities(): Promise<IEntity[]> {
    const currentUser = await firstValueFrom(this.strippedUser$);
    if (!currentUser) return [];

    const currentUserId = currentUser._id;

    const [owners, editors] = await Promise.all([
      this.backend.findEntitiesWithAccessRole('owner'),
      this.backend.findEntitiesWithAccessRole('editor'),
    ]);

    const entityWithDisplayRole = (entities: IEntity[], role: string): IEntity[] =>
      entities.map(entity => ({
        ...entity,
        accessRole: entity.access?.[currentUserId]?.role === role,
      }));

    const allEntities: [string, IEntity][] = [
      ...entityWithDisplayRole(editors, 'editor'),
      ...entityWithDisplayRole(owners, 'owner'),
    ].map(entity => [entity._id, entity]);

    return Array.from(new Map(allEntities).values());
  }

  private setUserData(userdata?: IUserDataWithoutData) {
    this.userData$.next(userdata ?? undefined);
    return userdata;
  }

  public async loginOrFetch(data?: { username: string; password: string }) {
    this.isWaitingForLogin$.next(true);
    const promise = data
      ? this.backend.login(data.username, data.password)
      : this.backend.isAuthorized();
    const result = await promise
      .then(userdata => this.setUserData(userdata))
      .catch(() => this.setUserData(undefined));
    this.events.updateSearchEvent();
    this.isWaitingForLogin$.next(false);
    return result;
  }

  public async logout() {
    await this.backend.logout().catch(() => {});
    this.userData$.next(undefined);
    this.events.updateSearchEvent();
  }
}
