import { Component, computed, inject, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DomSanitizer } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { DetailPageHelperService } from 'src/app/services';
import { ICompilation, IEntity, isEntity } from 'src/common';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-compilation-detail',
  templateUrl: './compilation-detail.component.html',
  styleUrls: ['./compilation-detail.component.scss'],
  imports: [MatTooltipModule, MatIconModule, RouterLink, TranslatePipe],
})
export class CompilationDetailComponent {
  #helper = inject(DetailPageHelperService);
  #sanitizer = inject(DomSanitizer);

  compilation = input<ICompilation>();

  creationDate = computed(() => {
    const compilation = this.compilation();
    if (!compilation) return '';
    return this.#helper.getCreationDate(compilation);
  });

  isAnnotatePrivate = computed(() => {
    const compilation = this.compilation();
    if (!compilation) return false;
    return !compilation.whitelist.enabled;
  });

  isAnnotatePublic = computed(() => {
    const compilation = this.compilation();
    if (!compilation) return false;
    return compilation.whitelist.enabled && compilation.whitelist.persons.length;
  });

  isAnnotateWhitelist = computed(() => {
    const compilation = this.compilation();
    if (!compilation) return false;
    return compilation.whitelist.enabled && compilation.whitelist.persons.length;
  });

  isPasswordProtected = computed(() => {
    const compilation = this.compilation();
    if (!compilation) return false;
    return compilation.password && compilation.password !== '';
  });

  imageCount = computed(() => {
    const compilation = this.compilation();
    if (!compilation) return 0;
    return Object.values(compilation.entities).filter(e => isEntity(e) && e.mediaType === 'image')
      .length;
  });

  modelCount = computed(() => {
    const compilation = this.compilation();
    if (!compilation) return 0;
    return Object.values(compilation.entities).filter(e => isEntity(e) && e.mediaType === 'model')
      .length;
  });

  videoCount = computed(() => {
    const compilation = this.compilation();
    if (!compilation) return 0;
    return Object.values(compilation.entities).filter(e => isEntity(e) && e.mediaType === 'video')
      .length;
  });

  audioCount = computed(() => {
    const compilation = this.compilation();
    if (!compilation) return 0;
    return Object.values(compilation.entities).filter(e => isEntity(e) && e.mediaType === 'audio')
      .length;
  });

  entityCount = computed(() => {
    const compilation = this.compilation();
    if (!compilation) return 0;
    return Object.keys(compilation.entities).length;
  });

  annotationCount = computed(() => {
    const compilation = this.compilation();
    if (!compilation) return 0;
    return Object.keys(compilation.annotations).length;
  });

  entities = computed((): IEntity[] => {
    const compilation = this.compilation();
    if (!compilation) return [];
    return Object.values(compilation.entities).filter(e => isEntity(e)) as IEntity[];
  });
}
