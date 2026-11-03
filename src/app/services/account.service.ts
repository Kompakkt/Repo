import { computed, inject, Service } from '@angular/core';
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
import { CacheManagerService } from './cache-manager.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { BackendService } from './backend.service';
import { SnackbarService } from './snackbar.service';
import { EventsService } from './events.service';

@Service()
export class AccountService {
  cache = inject(CacheManagerService);
  backend = inject(BackendService);
  snackbar = inject(SnackbarService);
  events = inject(EventsService);

  #isWaitingForLogin$ = new BehaviorSubject<boolean>(false);
  isWaitingForLogin = toSignal(this.#isWaitingForLogin$, { initialValue: false });
  #userdata$ = new Subject<IUserDataWithoutData | undefined>();

  updateTrigger$ = new BehaviorSubject<'all' | Collection | 'profile'>('all');
  updateTrigger = toSignal(this.updateTrigger$, { initialValue: 'all' });

  constructor() {
    this.restoreSelectedProfile();
    combineLatest([this.#user$, this.#draftEntities$]).subscribe(([user, unfinishedEntities]) => {
      if (!user) return;
      let message = `Logged in as ${user.fullname}`;
      const unpublished = unfinishedEntities.length;
      if (unpublished > 0) {
        const plural = unpublished === 1 ? '' : 's';
        message += `\nYou have ${unpublished} draft #upload${plural}`;
        message += `\nVisit your profile to work on your draft #object${plural}`;
      }
      this.snackbar.showMessage(message, 5);
    });
  }

  #userFromCache$ = this.cache.getItem$<IUserDataWithoutData>('user-data');

  #user$ = merge(
    this.#userFromCache$,
    this.#userdata$.pipe(delayWhen(() => this.#userFromCache$)),
  ).pipe(shareReplay(1));
  user = toSignal(this.#user$);

  #profiles$ = this.#user$.pipe(
    filter(user => !!user),
    combineLatestWith(this.updateTrigger$),
    filter(([_, trigger]) => trigger === 'all' || trigger === 'profile'),
    switchMap(([user]) => {
      return this.cache.getItem$<IPublicProfile[]>('user-profiles', () =>
        Promise.all(
          (user?.profiles ?? []).map(({ profileId }) => this.backend.getProfileById(profileId)),
        ),
      );
    }),
    map(result => result ?? []),
    map(profiles => profiles.filter(profile => !!profile) as IPublicProfile[]),
    shareReplay(1),
  );
  profiles = toSignal(this.#profiles$, { initialValue: [] as IPublicProfile[] });

  #userProfile$ = this.#profiles$.pipe(
    map(profiles => profiles.find(profile => profile.type === ProfileType.user)),
  );
  userProfile = toSignal(this.#userProfile$, { initialValue: undefined });

  #selectedProfile$ = new BehaviorSubject<IPublicProfile | undefined>(undefined);
  #currentProfile$ = combineLatest([this.#userProfile$, this.#selectedProfile$]).pipe(
    map(([userProfile, selectedProfile]) => selectedProfile ?? userProfile ?? undefined),
  );
  currentProfile = toSignal(this.#currentProfile$, { initialValue: undefined });

  switchToProfile(profile: IPublicProfile) {
    this.#selectedProfile$.next(profile);
    this.cache.setItem('selected-profile-id', profile._id).catch(() => {});
  }

  restoreSelectedProfile() {
    this.#profiles$
      .pipe(
        filter(profiles => profiles.length > 0),
        switchMap(async profiles => {
          if (this.#selectedProfile$.value) return;
          const cachedId = await firstValueFrom(
            this.cache.getItem$<string>('selected-profile-id').pipe(defaultIfEmpty(undefined)),
          );
          const profile = profiles.find(candidate => candidate._id === cachedId);
          if (profile && profile._id !== (await firstValueFrom(this.#userProfile$))?._id) {
            this.#selectedProfile$.next(profile);
          }
        }),
      )
      .subscribe();
  }

  #organizationProfiles$ = this.#profiles$.pipe(
    map(profiles => profiles.filter(profile => profile.type === ProfileType.organization)),
  );
  organizationalProfiles = toSignal(this.#organizationProfiles$, { initialValue: [] });

  #entities$: Observable<IEntity[]> = this.#user$.pipe(
    filter(user => !!user),
    combineLatestWith(this.updateTrigger$),
    filter(([_, trigger]) => trigger === 'all' || trigger === Collection.entity),
    switchMap(() => this.#currentProfile$),
    switchMap(profile =>
      this.cache.getItem$<IEntity[]>('profile-entities', () =>
        this.backend.getUserDataEntities({ profileId: profile?._id }),
      ),
    ),
    map(result => result ?? []),
    shareReplay(1),
  );
  entities = toSignal(this.#entities$, { initialValue: [] });

  #compilations$: Observable<ICompilation[]> = this.#user$.pipe(
    filter(user => !!user),
    combineLatestWith(this.updateTrigger$),
    filter(([_, trigger]) => trigger === 'all' || trigger === Collection.compilation),
    switchMap(() => this.#currentProfile$),
    switchMap(profile =>
      this.cache.getItem$<ICompilation[]>('profile-compilations', () =>
        this.backend.getUserDataCompilations({ profileId: profile?._id }),
      ),
    ),
    map(result => result ?? []),
    shareReplay(1),
  );
  compilations = toSignal(this.#compilations$, { initialValue: [] });

  #compilationsWithEntities$: Observable<ICompilation[]> = this.#user$.pipe(
    filter(user => !!user),
    combineLatestWith(this.updateTrigger$),
    filter(([_, trigger]) => trigger === 'all' || trigger === Collection.compilation),
    switchMap(() => this.#currentProfile$),
    switchMap(profile =>
      this.cache.getItem$<ICompilation[]>('profile-compilations-with-entities', () =>
        this.backend.getUserDataCompilations({
          depth: 1,
          profileId: profile?._id,
        }),
      ),
    ),
    map(result => result ?? []),
    shareReplay(1),
  );
  compilationsWithEntities = toSignal(this.#compilationsWithEntities$, { initialValue: [] });

  #annotations$: Observable<IAnnotation[]> = this.#user$.pipe(
    filter(user => !!user),
    combineLatestWith(this.updateTrigger$),
    filter(([_, trigger]) => trigger === 'all' || trigger === Collection.annotation),
    switchMap(() => this.#currentProfile$),
    switchMap(profile =>
      this.cache.getItem$<IAnnotation[]>('profile-annotations', () =>
        this.backend.getUserDataAnnotations({ profileId: profile?._id }),
      ),
    ),
    map(result => result ?? []),
    shareReplay(1),
  );
  annotations = toSignal(this.#annotations$, { initialValue: [] });

  #strippedUser$ = this.#user$.pipe(
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
  strippedUser = toSignal(this.#strippedUser$, { initialValue: undefined });

  #isAuthenticated$ = this.#user$.pipe(map(user => !!user));
  isAuthenticated = toSignal(this.#isAuthenticated$, { initialValue: false });

  roles = computed(() => {
    const user = this.user();
    return {
      isAdmin: user?.role === UserRank.admin,
      isUploader: user?.role === UserRank.admin || user?.role === UserRank.uploader,
    };
  });
  flags = computed(() => {
    const user = this.user();
    return {
      canModifyNews: user?.flags?.includes(UserFlag.canModifyNews) ?? false,
      testingCanManageOrganizations:
        user?.flags?.includes(UserFlag.testingCanManageOrganizations) ?? false,
    };
  });

  // Finished:
  #finishedEntities$ = this.#entities$.pipe(map(arr => arr.filter(e => e.finished)));
  finishedEntities = toSignal(this.#finishedEntities$, { initialValue: [] });
  // Unfinished: !finished
  #draftEntities$ = this.#entities$.pipe(map(arr => arr.filter(e => !e.finished)));
  draftEntities = toSignal(this.#draftEntities$, { initialValue: [] });

  async loginOrFetch(data?: { username: string; password: string }) {
    this.#isWaitingForLogin$.next(true);
    const promise = data
      ? this.backend.login(data.username, data.password)
      : this.backend.isAuthorized();
    const userdata = await promise.catch(() => undefined);

    if (userdata) {
      this.cache.setItem('user-data', userdata).catch(() => {});
    } else {
      localStorage.removeItem('jwt');
      this.cache.removeItem('user-data').catch(() => {});
    }

    this.#userdata$.next(isUserDataWithoutData(userdata) ? userdata : undefined);
    this.events.updateSearchEvent();
    this.#isWaitingForLogin$.next(false);
    return userdata;
  }

  async logout() {
    await this.backend.logout().catch(() => {});
    localStorage.removeItem('jwt');
    this.#userdata$.next(undefined);
    this.events.updateSearchEvent();
    this.cache.removeItem('user-data').catch(() => {});
    this.cache.removeItem('selected-profile-id').catch(() => {});
    this.#selectedProfile$.next(undefined);
  }

  /**
   * Get a snapshot of the current user data.
   * Can be undefined, or out of date if only cache hit is available.
   */
  async getUserDataSnapshot() {
    return await firstValueFrom(this.#user$.pipe(defaultIfEmpty(undefined)));
  }
}
