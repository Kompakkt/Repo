import { Component, computed, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { ICompilation, IEntity, isEntity } from '@kompakkt/common';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { UploadedByComponent } from '../uploaded-by/uploaded-by.component';

@Component({
  selector: 'app-compilation-detail',
  templateUrl: './compilation-detail.component.html',
  styleUrls: ['./compilation-detail.component.scss'],
  imports: [
    DatePipe,
    MatTooltipModule,
    MatIconModule,
    RouterLink,
    TranslatePipe,
    UploadedByComponent,
  ],
})
export class CompilationDetailComponent {
  compilation = input<ICompilation>();

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
