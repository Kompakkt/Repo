import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs';

import { IUserData } from '../interfaces';

import { MongoHandlerService } from './mongo-handler.service';
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
    private mongo: MongoHandlerService,
    private snackbar: SnackbarService,
  ) {
    // TODO Async function in constructor should be avoided
    this.checkIsAuthorized();
  }

  public async checkIsAuthorized() {
    return this.mongo
      .isAuthorized()
      .then(result => {
        // When testing, console.log fails with
        // "Cannot log after tests are done. Did you forget to wait for something async in your test?"
        // console.log(result);
        if (result.status === 'ok') {
          for (const prop in result.data) {
            result.data[prop] = (result.data[prop] as any[]).filter(e => e);
          }
          this.userDataSubject.next(result);
          this.isUserAuthenticatedSubject.next(true);
        } else {
          this.isUserAuthenticatedSubject.next(false);
        }
        return result.status === 'ok';
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
      this.mongo
        .login(username, password)
        .then(result => {
          if (result.status === 'ok') {
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
          } else {
            this.isUserAuthenticatedSubject.next(false);
            resolve(false);
          }
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
    return this.mongo
      .logout()
      .then(() => {})
      .catch(err => console.error(err));
  }
}
