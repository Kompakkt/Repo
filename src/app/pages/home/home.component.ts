import {
  AfterViewInit,
  Component,
  ElementRef,
  ViewChild,
  inject,
  computed,
  signal,
} from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { BehaviorSubject } from 'rxjs';

import { AsyncPipe } from '@angular/common';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from 'src/app/pipes';
import { AccountService, BackendService } from 'src/app/services';
import { ParticlesConfig } from 'src/assets/particles-config';
import { IEntity, IUserData } from 'src/common';
import { environment } from 'src/environment';
import { GridElementComponent } from '../../components/grid-element/grid-element.component';
import { SafePipe } from '../../pipes/safe.pipe';
import { CustomBrandingPlugin } from '@kompakkt/plugins/custom-branding';
import { IUserDataWithoutData } from 'src/common/interfaces';
import { MatButtonModule } from '@angular/material/button';

declare const particlesJS: any;

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [RouterLink, MatIconModule, MatButtonModule, SafePipe, TranslatePipe],
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

  constructor(
    private translatePipe: TranslatePipe,
    private titleService: Title,
    private metaService: Meta,
  ) {}

  ngAfterViewInit() {
    this.titleService.setTitle(
      this.metaTitle + this.translatePipe.transform('’cause the world is multidimensional.'),
    );
    this.metaService.addTags(this.metaTags);

    const url = new URL(environment.viewer_url);
    url.searchParams.set('transparent', 'true');
    // url.searchParams.set('model', 'undefined');
    url.searchParams.set('mode', '');
    this.viewerUrl.set(url.toString());

    particlesJS('particles', ParticlesConfig, () => {});
  }

  public onViewerLoad(event: Event) {
    const iframe = event.target as HTMLIFrameElement;
    requestAnimationFrame(() => {
      iframe.style.display = 'block';
      iframe.style.transform = 'scale(1)';
      this.viewerLoaded.set(true);
    });
  }
}
