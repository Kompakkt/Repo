import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

import { ParticlesConfig } from '../../../assets/particles-config';
import { environment } from '../../../environments/environment';
import { ICompilation, IEntity, IUserData } from 'src/common';
import { BackendService, AccountService } from '../../services';

declare const particlesJS: any;

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements AfterViewInit {
  private metaTitle = "Kompakkt – 'cause the world is multidimensional.";
  private metaTags = [
    {
      name: 'keywords',
      content: 'Kompakkt, 3d Viewer, Modelling, Digital Humanities',
    },
    {
      name: 'description',
      content:
        'Kompakkt covers images, videos, audio files and 3D models. ' +
        'Explore them in 3D and become part of our community to share your own content.',
    },
    { name: 'robots', content: 'index, follow' },
  ];

  public viewerUrl: string;
  public teaserEntities: IEntity[] = [];
  public userData: IUserData | undefined;

  @ViewChild('viewerFrame')
  public viewerFrame: ElementRef<HTMLIFrameElement> | undefined;

  @ViewChild('teaserCards')
  public teaserCards: ElementRef<HTMLElement> | undefined;
  private teaserShownCard = 0;
  private teaserTimer: any | undefined;
  private teaserLength = 15000;

  constructor(
    private account: AccountService,
    private backend: BackendService,
    private titleService: Title,
    private metaService: Meta,
  ) {
    this.viewerUrl = `${environment.viewer_url}`;

    this.account.userData$.subscribe(newData => {
      if (!newData) return;
      this.userData = newData;
    });
  }

  public getTeaserCompilations() {
    this.backend
      .getCompilation('5d6af3eb72b3dc766b27d748')
      .then(result => {
        if (!result) throw new Error('Password protected compilation');
        return result as ICompilation;
      })
      .then(
        result =>
          (this.teaserEntities = Object.values(result.entities) as IEntity[]),
      )
      .catch(e => console.error(e));
  }

  ngAfterViewInit() {
    this.titleService.setTitle(this.metaTitle);
    this.metaService.addTags(this.metaTags);

    this.getTeaserCompilations();
    particlesJS('particles', ParticlesConfig, () => {});

    this.resetTimer();
    this.updateTeaserCard();

    if (this.viewerFrame) {
      this.viewerFrame.nativeElement.onload = () =>
        this.viewerFrame &&
        this.viewerFrame.nativeElement.classList.toggle('display-fix');
    }
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
