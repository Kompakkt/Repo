import {
  AfterViewInit,
  Component,
  computed,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { CustomBrandingPlugin } from '@kompakkt/plugins/custom-branding';
import { TranslatePipe } from 'src/app/pipes/translate.pipe';
import { getViewerUrl } from 'src/app/util/get-viewer-url';
import { SafePipe } from '../../pipes/safe.pipe';
import { filter, firstValueFrom } from 'rxjs';
import { NewsCardComponent } from 'src/app/components/news-card/news-card.component';
import type { INewsItem } from '@kompakkt/common';
import { AccountService } from 'src/app/services/account.service';
import { BackendService } from 'src/app/services/backend.service';
import { DialogHelperService } from 'src/app/services/dialog-helper.service';
import { EventsService } from 'src/app/services/events.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [RouterLink, MatIconModule, MatButtonModule, SafePipe, TranslatePipe, NewsCardComponent],
})
export class HomeComponent implements AfterViewInit {
  #account = inject(AccountService);
  #backend = inject(BackendService);
  #dialogHelper = inject(DialogHelperService);
  #translatePipe = inject(TranslatePipe);
  #titleService = inject(Title);
  #metaService = inject(Meta);
  #eventsService = inject(EventsService);


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

  newsItems = signal<INewsItem[]>([]);
  showUnpublishedNews = signal<boolean>(false);
  visibleNewsItems = computed(() =>
    this.showUnpublishedNews() ? this.newsItems() : this.newsItems().filter(n => n.published),
  );
  canModifyNews = signal<boolean>(false);

  settingsLoadedEvent$ = this.#eventsService.windowMessages$.pipe(
    filter(event => event.data.type === 'settingsLoaded'),
  );

  openExternalLink(url: string) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  constructor(

  ) {
    // Show viewer after we get a signal from the viewer that settings have been loaded
    void firstValueFrom(this.settingsLoadedEvent$).then(() => {
      setTimeout(() => {
        this.viewerLoaded.set(true);
      }, 100);
    });

    void this.#loadNews();

    this.#account.flags.canModifyNews$.subscribe(hasFlag => {
      this.canModifyNews.set(hasFlag);
    });
  }

  async #loadNews() {
    try {
      const items = await this.#backend.getNews();
      this.newsItems.set(items as unknown as INewsItem[]);
    } catch (err) {
      console.error('Failed to load news items:', err);
    }
  }

  openCreateNewsDialog() {
    const ref = this.#dialogHelper.openCreateNewsDialog();
    void firstValueFrom(ref.afterClosed()).then(result => {
      if (result) void this.#loadNews();
    });
  }

  openEditNewsDialog(item: INewsItem) {
    const ref = this.#dialogHelper.openEditNewsDialog(item);
    void firstValueFrom(ref.afterClosed()).then(result => {
      if (result) void this.#loadNews();
    });
  }

  async deleteNewsItem(item: INewsItem) {
    const confirmed = await this.#dialogHelper.confirm(
      `Delete news item "${item.title}"?`,
      'Delete news item',
    );
    if (!confirmed) return;

    try {
      await this.#backend.deleteNews(item._id.toString());
      void this.#loadNews();
    } catch (err) {
      console.error('Failed to delete news item:', err);
    }
  }

  // Fallback if communication with viewer fails for some reason - show the viewer after a delay
  delayedViewerLoad() {
    setTimeout(() => {
      this.viewerLoaded.set(true);
    }, 2000);
  }

  ngAfterViewInit() {
    this.#titleService.setTitle(
      this.metaTitle + this.#translatePipe.transform('\u2019cause the world is multidimensional.'),
    );
    this.#metaService.addTags(this.metaTags);

    const url = new URL(getViewerUrl());
    url.searchParams.set('transparent', 'true');
    // url.searchParams.set('model', 'undefined');
    url.searchParams.set('mode', '');
    this.viewerUrl.set(url.toString());
  }
}
