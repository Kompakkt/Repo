import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs';

import { IUserData } from '@kompakkt/shared';

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

  private userDataSubject = new ReplaySubject<IUserData>();
  public userDataObservable = this.userDataSubject.asObservable();

  private isUserAuthenticatedSubject = new ReplaySubject<boolean>();
  public isUserAuthenticatedObservable = this.isUserAuthenticatedSubject.asObservable();

  constructor(
    private backend: BackendService,
    private snackbar: SnackbarService,
    private events: EventsService,
  ) {
    // TODO Async function in constructor should be avoided
    this.checkIsAuthorized();
  }

  public async checkIsAuthorized() {
    return this.backend
      .isAuthorized()
      .then(result => {
        // When testing, console.log fails with
        // "Cannot log after tests are done. Did you forget to wait for something async in your test?"
        // console.log(result);
        for (const prop in result.data) {
          result.data[prop] = (result.data[prop] as any[]).filter(e => e);
        }
        this.userDataSubject.next(result);
        this.isUserAuthenticatedSubject.next(true);
        return true;
      })
      .catch(err => {
        // console.log(err);
        this.isUserAuthenticatedSubject.next(false);
      });
  }

  public async attemptLogin(
    username: string,
    password: string,
  ): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.backend
        .login(username, password)
        .then(result => {
          for (const prop in result.data) {
            result.data[prop] = (result.data[prop] as any[]).filter(e => e);
          }
          this.userDataSubject.next(result);
          this.snackbar.showMessage(`Logged in as ${result.fullname}`);
          this.loginData = {
            username,
            password,
            isCached: true,
          };
          this.isUserAuthenticatedSubject.next(true);
          resolve(true);
        })
        .catch(err => {
          console.error(err);
          this.isUserAuthenticatedSubject.next(false);
          reject(false);
        });
    });
  }

  public logout() {
    this.loginData = {
      username: '',
      password: '',
      isCached: false,
    };
    this.userDataSubject.next(undefined);
    this.isUserAuthenticatedSubject.next(false);
    return this.backend
      .logout()
      .then(() => this.events.updateSearchEvent())
      .catch(err => console.error(err));
  }
}
