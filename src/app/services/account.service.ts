import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, concat, firstValueFrom, Observable, of } from 'rxjs';
import {
  catchError,
  combineLatestWith,
  defaultIfEmpty,
  filter,
  map,
  shareReplay,
  switchMap,
  timeout,
} from 'rxjs/operators';

import { Collection, ICompilation, IEntity, IGroup, ProfileType, UserRank } from 'src/common';
import {
  IAnnotation,
  IPublicProfile,
  IStrippedUserData,
  IUserDataWithoutData,
} from 'src/common/interfaces';
import { BackendService, EventsService, SnackbarService } from './';
import { CacheManagerService } from './cache-manager.service';

@Injectable({ providedIn: 'root' })
export class AccountService {
  #cache = inject(CacheManagerService);
  #backend = inject(BackendService);
  #snackbar = inject(SnackbarService);
  #events = inject(EventsService);

  isWaitingForLogin$ = new BehaviorSubject<boolean>(false);
  #userdata$ = new BehaviorSubject<IUserDataWithoutData | undefined>(undefined);

  updateTrigger$ = new BehaviorSubject<'all' | Collection | 'profile'>('all');

  constructor() {
    this.#userdata$.subscribe(changes => console.log('Userdata changed:', changes));

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

  user$ = concat(
    this.#cache.getItem<IUserDataWithoutData>('user-data').pipe(filter(user => !!user)),
    this.#userdata$.pipe(filter(user => !!user)),
  ).pipe(
    timeout({ first: 5000 }),
    catchError(() => of(undefined)),
  );

  profiles$ = this.user$.pipe(
    filter(user => !!user),
    combineLatestWith(this.updateTrigger$),
    filter(([_, trigger]) => trigger === 'all' || trigger === 'profile'),
    switchMap(([user]) => {
      const profileIds = Object.keys(user.profiles ?? {});
      return this.#cache.getItem<IPublicProfile[]>('user-profiles', () =>
        Promise.all(profileIds.map(id => this.#backend.getProfileByIdOrName(id))),
      );
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
    filter(user => !!user),
    combineLatestWith(this.updateTrigger$),
    filter(([_, trigger]) => trigger === 'all' || trigger === Collection.entity),
    switchMap(() =>
      this.#cache.getItem<IEntity[]>('profile-entities', () =>
        this.fetchProfileEntities().catch(() => []),
      ),
    ),
    shareReplay(1),
  );

  compilations$: Observable<ICompilation[]> = this.user$.pipe(
    filter(user => !!user),
    combineLatestWith(this.updateTrigger$),
    filter(([_, trigger]) => trigger === 'all' || trigger === Collection.compilation),
    switchMap(() =>
      this.#cache.getItem<ICompilation[]>('profile-compilations', () =>
        this.#backend.getUserDataCollection(Collection.compilation),
      ),
    ),
    shareReplay(1),
  );

  compilationsWithEntities$: Observable<ICompilation[]> = this.user$.pipe(
    filter(user => !!user),
    combineLatestWith(this.updateTrigger$),
    filter(([_, trigger]) => trigger === 'all' || trigger === Collection.compilation),
    switchMap(() =>
      this.#cache.getItem<ICompilation[]>('profile-compilations-with-entities', () =>
        this.#backend.getUserDataCollection(Collection.compilation, { depth: 1 }),
      ),
    ),
    shareReplay(1),
  );

  groups$: Observable<IGroup[]> = this.user$.pipe(
    filter(user => !!user),
    combineLatestWith(this.updateTrigger$),
    filter(([_, trigger]) => trigger === 'all' || trigger === Collection.group),
    switchMap(() =>
      this.#cache.getItem<IGroup[]>('profile-groups', () =>
        this.#backend.getUserDataCollection(Collection.group),
      ),
    ),
    shareReplay(1),
  );

  annotations$: Observable<IAnnotation[]> = this.user$.pipe(
    filter(user => !!user),
    combineLatestWith(this.updateTrigger$),
    filter(([_, trigger]) => trigger === Collection.annotation),
    switchMap(() =>
      this.#cache.getItem<IAnnotation[]>('profile-annotations', () =>
        this.#backend.getUserDataCollection(Collection.annotation),
      ),
    ),
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

  isAuthenticated$ = this.#userdata$.pipe(map(user => !!user));
  role = {
    isAdmin$: this.#userdata$.pipe(map(user => user?.role === UserRank.admin)),
    isUploader$: this.#userdata$.pipe(
      map(userdata => userdata?.role === UserRank.admin || userdata?.role === UserRank.uploader),
    ),
    hasRequestedUploader$: this.#userdata$.pipe(
      map(userdata => userdata?.role === UserRank.uploadrequested),
    ),
    $: this.#userdata$.pipe(map(user => user?.role ?? 'guest')),
    ranks: UserRank,
  };

  // Finished:
  finishedEntities$ = this.entities$.pipe(map(arr => arr.filter(e => e.finished)));
  // Unfinished: !finished
  draftEntities$ = this.entities$.pipe(map(arr => arr.filter(e => !e.finished)));

  private async fetchProfileEntities(): Promise<IEntity[]> {
    const currentUser = await firstValueFrom(this.strippedUser$);
    if (!currentUser) return [];

    const currentUserId = currentUser._id;

    const [owners, editors] = await Promise.all([
      this.#backend.findEntitiesWithAccessRole('owner'),
      this.#backend.findEntitiesWithAccessRole('editor'),
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

  public async loginOrFetch(data?: { username: string; password: string }) {
    this.isWaitingForLogin$.next(true);
    const promise = data
      ? this.#backend.login(data.username, data.password)
      : this.#backend.isAuthorized();
    const result = await promise
      .then(userdata => {
        this.#userdata$.next(userdata);
        return userdata;
      })
      .catch(() => {
        this.#userdata$.next(undefined);
        return undefined;
      });
    this.#events.updateSearchEvent();
    this.isWaitingForLogin$.next(false);
    return result;
  }

  public async logout() {
    await this.#backend.logout().catch(() => {});
    this.#userdata$.next(undefined);
    this.#events.updateSearchEvent();
  }

  /**
   * Get a snapshot of the current user data.
   * Can be undefined, or out of date if only cache hit is available.
   */
  public async getUserDataSnapshot() {
    return await firstValueFrom(this.user$.pipe(defaultIfEmpty(undefined)));
  }
}
