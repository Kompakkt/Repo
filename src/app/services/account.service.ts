import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs';

import { IUserData, IEntity, isResolved, isEntity } from '~common/interfaces';

import { EventsService } from './events.service';
import { BackendService } from './backend.service';
import { SnackbarService } from './snackbar.service';

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  // Store userData in memory for re-auth on locked routes (e.g. admin page)
  public loginData: {
    username: string;
    password: string;
    isCached: boolean;
  } = {
    username: '',
    password: '',
    isCached: false,
  };

  private _userData: IUserData | undefined;
  private userDataSubject = new ReplaySubject<IUserData>(1);
  public userData$ = this.userDataSubject.asObservable();

  constructor(
    private backend: BackendService,
    private snackbar: SnackbarService,
    private events: EventsService,
  ) {
    this.userData$.subscribe(changes => console.log('Userdata changed:', changes));
  }

  // Published: finished && online && !whitelist.enabled
  get publishedEntities(): IEntity[] {
    return (
      this._userData?.data?.entity?.filter(
        entity => isEntity(entity) && entity.finished && entity.online && !entity.whitelist.enabled,
      ) ?? []
    );
  }

  // Unpublished: finished && !online
  get unpublishedEntities(): IEntity[] {
    return (
      this._userData?.data?.entity?.filter(
        entity => isEntity(entity) && entity.finished && !entity.online,
      ) ?? []
    );
  }

  // Restricted: finished && online && whitelist.enabled
  get restrictedEntities(): IEntity[] {
    return (
      this._userData?.data?.entity?.filter(
        entity => isEntity(entity) && entity.finished && entity.online && entity.whitelist.enabled,
      ) ?? []
    );
  }

  // Unfinished: !finished
  get unfinishedEntities(): IEntity[] {
    return (
      this._userData?.data?.entity?.filter(entity => isEntity(entity) && !entity.finished) ?? []
    );
  }

  get isUserAuthenticated() {
    return this._userData !== undefined;
  }

  get isUserAdmin() {
    return this._userData?.role === 'admin' ?? false;
  }

  private saveUserData(userdata: IUserData, welcomeUser: boolean) {
    for (const prop in userdata.data)
      userdata.data[prop] = (userdata.data[prop] as any[]).filter(e => e);

    this._userData = userdata;
    this.userDataSubject.next(this._userData);

    if (this._userData && welcomeUser) {
      let message = `Logged in as ${this._userData.fullname}`;
      const unpublished = this.unpublishedEntities.length;
      if (unpublished > 0) {
        const plural = unpublished === 1 ? '' : 's';
        message += `\nYou have ${unpublished} unpublished object${plural}`;
        message += `\nVisit your profile to work on your unpublished object${plural}`;
      }
      this.snackbar.showMessage(message, 5);
    }
    return userdata;
  }

  private resetUserData() {
    this.loginData = {
      username: '',
      password: '',
      isCached: false,
    };
    this._userData = undefined;
    this.userDataSubject.next(this._userData);
  }

  public fetchUserData() {
    return this.backend
      .isAuthorized()
      .then(userdata => this.saveUserData(userdata, false))
      .catch(() => {
        this._userData = undefined;
        return undefined;
      });
  }

  public async attemptLogin(username: string, password: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.backend
        .login(username, password)
        .then(userdata => this.saveUserData(userdata, true))
        .then(() => {
          this.loginData = {
            username,
            password,
            isCached: true,
          };
          resolve(true);
        })
        .catch(err => {
          console.error(err);
          this.resetUserData();
          reject(false);
        });
    });
  }

  public logout() {
    this.resetUserData();
    return this.backend
      .logout()
      .then(() => this.events.updateSearchEvent())
      .catch(err => console.error(err));
  }
}
