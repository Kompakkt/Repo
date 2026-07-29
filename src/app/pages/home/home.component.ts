import { AfterViewInit, Component, computed, inject, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { CustomBrandingPlugin } from '@kompakkt/plugins/custom-branding';
import { TranslatePipe } from 'src/app/pipes';
import { getViewerUrl } from 'src/app/util/get-viewer-url';
import { SafePipe } from '../../pipes/safe.pipe';
import { EventsService } from 'src/app/services';
import { filter, firstValueFrom } from 'rxjs';
import { DatePipe } from '@angular/common';

type NewsItem = {
  title: string;
  lines: [string] | [string, string];
  link: string;
  date: Date;
  imageUrl: string;
};

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [
    RouterLink,
    MatIconModule,
    MatButtonModule,
    SafePipe,
    TranslatePipe,
    DatePipe,
  ],
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

  viewerUrl = signal<string>('');
  viewerLoaded = signal<boolean>(false);

  #customBrandingPlugin = inject<CustomBrandingPlugin>(CustomBrandingPlugin.providerToken, {
    optional: true,
  });
  customLogoText = computed(() => {
    const settings = this.#customBrandingPlugin?.settings();
    return settings?.explorePageLogoText;
  });
  customLogoTextColor = computed(() => {
    const settings = this.#customBrandingPlugin?.settings();
    return settings?.explorePageLogoTextColor;
  });
  customLogoAsset = computed(() => {
    const settings = this.#customBrandingPlugin?.settings();
    return settings?.base64Assets?.explorePageLogo;
  });

  settingsLoadedEvent$ = this.eventsService.windowMessages$.pipe(
    filter(event => event.data.type === 'settingsLoaded'),
  );

  newsItems = signal<NewsItem[]>([
    {
      title: 'IIIF compatibility',
      lines: [
        'Kompakkt entered a phase of testing close compatibility with the new IIIF 3D API.',
        'Check out demo manifests loading in Kompakkt!',
      ],
      link: 'https://kompakkt.github.io/Viewer/?locale=en',
      imageUrl: '/assets/images/news/kompakkt_loves_iiif.png',
      date: new Date('2026-07-27T00:00:00Z'),
    },
    {
      title: 'A New Explore Page for Kompakkt: Find Faster, Curate better',
      lines: ['We have completely redesigned the Explore Page of our 3D viewer to improve the discovery and organization of objects.'],
      link: 'https://blog.tib.eu/2026/04/24/neue-explore-page-in-kompakkt-schneller-finden-besser-sammeln/',
      imageUrl: 'https://blog.tib.eu/wp-content/uploads/2026/04/Bildschirmfoto-2026-04-15-um-14.54.58-2048x965.png',
      date: new Date('2026-04-24T00:00:00Z'),
    },
    {
      title: 'Beyond Meshes: Support for Point Clouds and Gaussian Splatting',
      lines: ['Not every research question can be answered using the same type of 3D data. While meshes are ideal for traditional 3D models, point clouds excel at representing precise measurement data, and Gaussian Splatting enables highly realistic visualizations of complex scenes.'],
      link: 'https://blog.tib.eu/2026/07/24/mehr-als-meshes-unterstuetzung-fuer-punktwolken-und-gaussian-splatting/',
      imageUrl: 'https://blog.tib.eu/wp-content/uploads/2026/07/pexels-steve-10194138-1-2048x1365.jpg',
      date: new Date('2026-07-24T00:00:00Z'),
    }
  ]);

  openExternalLink(url: string) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  constructor(
    private translatePipe: TranslatePipe,
    private titleService: Title,
    private metaService: Meta,
    private eventsService: EventsService,
  ) {
    // Show viewer after we get a signal from the viewer that settings have been loaded
    void firstValueFrom(this.settingsLoadedEvent$).then(() => {
      setTimeout(() => {
        this.viewerLoaded.set(true);
      }, 100);
    });
  }

  // Fallback if communication with viewer fails for some reason - show the viewer after a delay
  delayedViewerLoad() {
    setTimeout(() => {
      this.viewerLoaded.set(true);
    }, 2000);
  }

  ngAfterViewInit() {
    this.titleService.setTitle(
      this.metaTitle + this.translatePipe.transform('’cause the world is multidimensional.'),
    );
    this.metaService.addTags(this.metaTags);

    const url = new URL(getViewerUrl());
    url.searchParams.set('transparent', 'true');
    // url.searchParams.set('model', 'undefined');
    url.searchParams.set('mode', '');
    this.viewerUrl.set(url.toString());
  }
}
