import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { BehaviorSubject } from 'rxjs';

import { AsyncPipe } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from 'src/app/pipes';
import { AccountService, BackendService } from 'src/app/services';
import { ParticlesConfig } from 'src/assets/particles-config';
import { IEntity, IUserData } from 'src/common';
import { environment } from 'src/environment';
import { GridElementComponent } from '../../components/grid-element/grid-element.component';
import { SafePipe } from '../../pipes/safe.pipe';

declare const particlesJS: any;

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [RouterLink, MatIcon, GridElementComponent, AsyncPipe, SafePipe, TranslatePipe],
})
export class HomeComponent implements AfterViewInit {
  private metaTitle = 'Kompakkt – ';
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
  private viewerLoaded = new BehaviorSubject<boolean>(false);

  public teaserEntities: IEntity[] = [];
  public userData: IUserData | undefined;

  @ViewChild('teaserCards')
  public teaserCards: ElementRef<HTMLElement> | undefined;
  public selectedCard = 0;
  private teaserTimer: any | undefined;
  private cardInterval = 15000;

  constructor(
    private translatePipe: TranslatePipe,
    private account: AccountService,
    private backend: BackendService,
    private titleService: Title,
    private metaService: Meta,
  ) {
    this.viewerUrl = `${environment.viewer_url}`;

    this.account.user$.subscribe(newData => {
      this.userData = newData;
    });
  }

  public getTeaserCompilations() {
    this.backend
      .getCompilation('5d6af3eb72b3dc766b27d748')
      .then(result => {
        if (!result) throw new Error('Password protected compilation');
        this.teaserEntities = Object.values(result.entities) as IEntity[];
      })
      .catch(e => console.error(e));
  }

  ngAfterViewInit() {
    this.titleService.setTitle(
      this.metaTitle + this.translatePipe.transform('’cause the world is multidimensional.'),
    );
    this.metaService.addTags(this.metaTags);

    this.getTeaserCompilations();
    particlesJS('particles', ParticlesConfig, () => {});

    this.resetTimer();
    this.updateTeaserCard();
  }

  get viewerLoaded$() {
    return this.viewerLoaded.asObservable();
  }

  private resetTimer() {
    if (this.teaserTimer) {
      clearInterval(this.teaserTimer);
      this.teaserTimer = undefined;
    }

    this.teaserTimer = setInterval(() => this.rotateTeaserCards(), this.cardInterval);
  }

  private rotateTeaserCards() {
    this.selectedCard++;
    this.updateTeaserCard();
  }

  private updateTeaserCard() {
    this.teaserCards?.nativeElement.childNodes.forEach((childNode, index) => {
      const child = childNode as HTMLDivElement;
      if (index === this.selectedCard % 3) {
        child.classList.add('shown');
      } else {
        child.classList.remove('shown');
      }
    });
  }

  public onViewerLoad(event: Event) {
    const iframe = event.target as HTMLIFrameElement;
    requestAnimationFrame(() => {
      iframe.style.display = 'block';
      iframe.style.transform = 'scale(1)';
      this.viewerLoaded.next(true);
    });
  }

  public setTeaserCard(index: number) {
    this.resetTimer();
    this.selectedCard = index;
    this.updateTeaserCard();
  }

  public previousCard() {
    this.resetTimer();
    this.selectedCard = this.selectedCard >= 1 ? this.selectedCard - 1 : 2;
    this.updateTeaserCard();
  }

  public nextCard() {
    this.resetTimer();
    this.selectedCard++;
    this.updateTeaserCard();
  }
}
