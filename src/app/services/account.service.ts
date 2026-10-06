import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, firstValueFrom, merge, Observable, Subject } from 'rxjs';
import {
  combineLatestWith,
  defaultIfEmpty,
  delayWhen,
  filter,
  map,
  shareReplay,
  switchMap,
} from 'rxjs/operators';

import {
  Collection,
  ICompilation,
  IEntity,
  ProfileType,
  UserRank,
  UserFlag,
  IAnnotation,
  IPublicProfile,
  IStrippedUserData,
  IUserDataWithoutData,
  isUserDataWithoutData,
} from '@kompakkt/common';
import { BackendService, EventsService, SnackbarService } from './';
import { CacheManagerService } from './cache-manager.service';

@Injectable({ providedIn: 'root' })
export class AccountService {
  #cache = inject(CacheManagerService);
  #backend = inject(BackendService);
  #snackbar = inject(SnackbarService);
  #events = inject(EventsService);

  isWaitingForLogin$ = new BehaviorSubject<boolean>(false);
  #userdata$ = new Subject<IUserDataWithoutData | undefined>();

  updateTrigger$ = new BehaviorSubject<'all' | Collection | 'profile'>('all');

  constructor() {
    this.#restoreSelectedProfile();
    combineLatest([this.user$, this.draftEntities$]).subscribe(([user, unfinishedEntities]) => {
      if (!user) return;
      let message = `Logged in as ${user.fullname}`;
      const unpublished = unfinishedEntities.length;
      if (unpublished > 0) {
        const plural = unpublished === 1 ? '' : 's';
        message += `\nYou have ${unpublished} draft upload${plural}`;
        message += `\nVisit your profile to work on your draft object${plural}`;
      }
      this.#snackbar.showMessage(message, 5);
    });
  }

  #userFromCache$ = this.#cache.getItem<IUserDataWithoutData>('user-data');

  user$ = merge(
    this.#userFromCache$,
    this.#userdata$.pipe(delayWhen(() => this.#userFromCache$)),
  ).pipe(shareReplay(1));

  profiles$ = this.user$.pipe(
    filter(user => !!user),
    combineLatestWith(this.updateTrigger$),
    filter(([_, trigger]) => trigger === 'all' || trigger === 'profile'),
    switchMap(([user]) => {
      return this.#cache.getItem<IPublicProfile[]>('user-profiles', () =>
        Promise.all(
          (user?.profiles ?? []).map(({ profileId }) => this.#backend.getProfileById(profileId)),
        ),
      );
    }),
    map(result => result ?? []),
    map(profiles => profiles.filter(profile => !!profile) as IPublicProfile[]),
    shareReplay(1),
  );

  userProfile$ = this.profiles$.pipe(
    map(profiles => profiles.find(profile => profile.type === ProfileType.user)),
  );

  selectedProfile$ = new BehaviorSubject<IPublicProfile | null>(null);
  currentProfile$ = combineLatest([this.userProfile$, this.selectedProfile$]).pipe(
    map(([userProfile, selectedProfile]) => selectedProfile ?? userProfile ?? null),
  );

  switchToProfile(profile: IPublicProfile) {
    this.selectedProfile$.next(profile);
    this.#cache.setItem('selected-profile-id', profile._id).catch(() => {});
  }

  #restoreSelectedProfile() {
    this.profiles$
      .pipe(
        filter(profiles => profiles.length > 0),
        switchMap(async profiles => {
          if (this.selectedProfile$.value) return;
          const cachedId = await firstValueFrom(
            this.#cache.getItem<string>('selected-profile-id').pipe(defaultIfEmpty(undefined)),
          );
          const profile = profiles.find(candidate => candidate._id === cachedId);
          if (profile && profile._id !== (await firstValueFrom(this.userProfile$))?._id) {
            this.selectedProfile$.next(profile);
          }
        }),
      )
      .subscribe();
  }

  organizationProfiles$ = this.profiles$.pipe(
    map(profiles => profiles.filter(profile => profile.type === ProfileType.organization)),
  );

  entities$: Observable<IEntity[]> = this.user$.pipe(
    filter(user => !!user),
    combineLatestWith(this.updateTrigger$),
    filter(([_, trigger]) => trigger === 'all' || trigger === Collection.entity),
    switchMap(() => this.currentProfile$),
    switchMap(profile =>
      this.#cache.getItem<IEntity[]>('profile-entities', () =>
        this.#backend.getUserDataEntities({ profileId: profile?._id }),
      ),
    ),
    map(result => result ?? []),
    shareReplay(1),
  );

  compilations$: Observable<ICompilation[]> = this.user$.pipe(
    filter(user => !!user),
    combineLatestWith(this.updateTrigger$),
    filter(([_, trigger]) => trigger === 'all' || trigger === Collection.compilation),
    switchMap(() => this.currentProfile$),
    switchMap(profile =>
      this.#cache.getItem<ICompilation[]>('profile-compilations', () =>
        this.#backend.getUserDataCompilations({ profileId: profile?._id }),
      ),
    ),
    map(result => result ?? []),
    shareReplay(1),
  );

  compilationsWithEntities$: Observable<ICompilation[]> = this.user$.pipe(
    filter(user => !!user),
    combineLatestWith(this.updateTrigger$),
    filter(([_, trigger]) => trigger === 'all' || trigger === Collection.compilation),
    switchMap(() => this.currentProfile$),
    switchMap(profile =>
      this.#cache.getItem<ICompilation[]>('profile-compilations-with-entities', () =>
        this.#backend.getUserDataCompilations({
          depth: 1,
          profileId: profile?._id,
        }),
      ),
    ),
    map(result => result ?? []),
    shareReplay(1),
  );

  annotations$: Observable<IAnnotation[]> = this.user$.pipe(
    filter(user => !!user),
    combineLatestWith(this.updateTrigger$),
    filter(([_, trigger]) => trigger === 'all' || trigger === Collection.annotation),
    switchMap(() => this.currentProfile$),
    switchMap(profile =>
      this.#cache.getItem<IAnnotation[]>('profile-annotations', () =>
        this.#backend.getUserDataAnnotations({ profileId: profile?._id }),
      ),
    ),
    map(result => result ?? []),
    shareReplay(1),
  );

  strippedUser$ = this.user$.pipe(
    filter(user => !!user),
    map(
      user =>
        ({
          _id: user._id,
          fullname: user.fullname,
          username: user.username,
        }) as IStrippedUserData,
    ),
  );

  isAuthenticated$ = this.user$.pipe(map(user => !!user));
  role = {
    isAdmin$: this.user$.pipe(map(user => user?.role === UserRank.admin)),
    isUploader$: this.user$.pipe(
      map(userdata => userdata?.role === UserRank.admin || userdata?.role === UserRank.uploader),
    ),
    $: this.user$.pipe(map(user => user?.role ?? 'guest')),
    ranks: UserRank,
  };
  flags = {
    has$: (flag: UserFlag): Observable<boolean> =>
      this.user$.pipe(map(user => user?.flags?.includes(flag) ?? false)),
    canModifyNews$: this.user$.pipe(
      map(user => user?.flags?.includes(UserFlag.canModifyNews) ?? false),
    ),
  };

  // Finished:
  finishedEntities$ = this.entities$.pipe(map(arr => arr.filter(e => e.finished)));
  // Unfinished: !finished
  draftEntities$ = this.entities$.pipe(map(arr => arr.filter(e => !e.finished)));

  public async loginOrFetch(data?: { username: string; password: string }) {
    this.isWaitingForLogin$.next(true);
    const promise = data
      ? this.#backend.login(data.username, data.password)
      : this.#backend.isAuthorized();
    const userdata = await promise.catch(() => undefined);

    if (userdata) {
      this.#cache.setItem('user-data', userdata).catch(() => {});
    } else {
      localStorage.removeItem('jwt');
      this.#cache.removeItem('user-data').catch(() => {});
    }

    this.#userdata$.next(isUserDataWithoutData(userdata) ? userdata : undefined);
    this.#events.updateSearchEvent();
    this.isWaitingForLogin$.next(false);
    return userdata;
  }

  public async logout() {
    await this.#backend.logout().catch(() => {});
    localStorage.removeItem('jwt');
    this.#userdata$.next(undefined);
    this.#events.updateSearchEvent();
    this.#cache.removeItem('user-data').catch(() => {});
    this.#cache.removeItem('selected-profile-id').catch(() => {});
    this.selectedProfile$.next(null);
  }

  /**
   * Get a snapshot of the current user data.
   * Can be undefined, or out of date if only cache hit is available.
   */
  public async getUserDataSnapshot() {
    return await firstValueFrom(this.user$.pipe(defaultIfEmpty(undefined)));
  }
}
