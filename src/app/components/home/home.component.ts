import { Component, OnInit } from '@angular/core';

import { ParticlesConfig } from '../../../assets/particles-config';
import { environment } from '../../../environments/environment';
import { MongoHandlerService } from '../../services/mongo-handler.service';
import { IUserData } from '../../interfaces';
import { AccountService } from '../../services/account.service';

declare var particlesJS: any;

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  public viewerUrl: string;
  public teaserEntities;
  public isAuthenticated = false;
  public userData: IUserData | undefined;

  public icons = {
    audio: 'audiotrack',
    video: 'movie',
    image: 'image',
    model: 'language',
    collection: 'apps',
  };

  constructor(
    private account: AccountService,
    private mongo: MongoHandlerService,
  ) {
    this.viewerUrl = `${environment.kompakkt_url}`;

    this.account.isUserAuthenticatedObservable.subscribe(
      state => (this.isAuthenticated = state),
    );
    this.account.userDataObservable.subscribe(newData => {
      if (!newData) return;
      this.userData = newData;
      console.log('Userdata received in ProfilePageComponent', this.userData);
    });
  }

  public getTeaserCompilations() {
    this.mongo
      .getCompilation('5d6af3eb72b3dc766b27d748')
      .then(result => {
        if (result.status === 'ok') {
          this.teaserEntities = result.entities;
        } else {
          throw new Error(result.message);
        }
      })
      .catch(e => console.error(e));
  }

  ngOnInit() {
    this.getTeaserCompilations();
    particlesJS('particles', ParticlesConfig, () => {});
  }
}
