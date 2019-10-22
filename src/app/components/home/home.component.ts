import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';

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
export class HomeComponent implements AfterViewInit {
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

  @ViewChild('teaserCards', { static: false })
  public teaserCards: ElementRef<HTMLElement> | undefined;
  private teaserShownCard = 0;
  private teaserTimer: any | undefined;
  private teaserLength = 15000;

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

  ngAfterViewInit() {
    this.getTeaserCompilations();
    particlesJS('particles', ParticlesConfig, () => {});

    this.resetTimer();
    this.updateTeaserCard();
  }

  private resetTimer() {
    if (this.teaserTimer) {
      clearInterval(this.teaserTimer);
      this.teaserTimer = undefined;
    }

    this.teaserTimer = setInterval(
      () => this.rotateTeaserCards(),
      this.teaserLength,
    );
  }

  private rotateTeaserCards() {
    this.teaserShownCard++;
    this.updateTeaserCard();
  }

  private updateTeaserCard() {
    if (!this.teaserCards) return;
    this.teaserCards.nativeElement.childNodes.forEach((child, index) => {
      if (index === this.teaserShownCard % 3) {
        (child as HTMLDivElement).classList.add('shown');
      } else {
        (child as HTMLDivElement).classList.remove('shown');
      }
    });
  }

  public setTeaserCard(index: number) {
    this.resetTimer();
    this.teaserShownCard = index;
    this.updateTeaserCard();
  }

  public previousCard() {
    this.resetTimer();
    this.teaserShownCard =
      this.teaserShownCard >= 1 ? this.teaserShownCard - 1 : 2;
    this.updateTeaserCard();
  }

  public nextCard() {
    this.resetTimer();
    this.teaserShownCard++;
    this.updateTeaserCard();
  }
}
