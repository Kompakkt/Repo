import { Component, output, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from 'src/app/pipes';
import type { INewsItem } from '@kompakkt/common';

@Component({
  selector: 'app-news-card',
  templateUrl: './news-card.component.html',
  styleUrl: './news-card.component.scss',
  imports: [DatePipe, MatIconModule, MatButtonModule, MatTooltipModule, TranslatePipe],
  host: {
    '[class.is-preview]': 'isPreview()',
    '(click)': 'openLink(newsItem().link)',
  },
})
export class NewsCardComponent {
  newsItem = input.required<INewsItem>();
  showActions = input<boolean>(false);
  isPreview = input<boolean>(false);

  edit = output<INewsItem>();
  delete = output<INewsItem>();

  openLink(url?: string) {
    if (this.isPreview()) return;
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  }

  onEdit(event: Event) {
    event.stopPropagation();
    this.edit.emit(this.newsItem());
  }

  onDelete(event: Event) {
    event.stopPropagation();
    this.delete.emit(this.newsItem());
  }
}
