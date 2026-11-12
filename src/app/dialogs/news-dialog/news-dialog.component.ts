import {
  Component,
  computed,
  ElementRef,
  inject,
  signal,
  viewChild,
  model,
  AfterViewInit,
  effect,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from 'src/app/pipes/translate.pipe';
import { NewsCardComponent } from 'src/app/components/news-card/news-card.component';
import type { INewsItem } from '@kompakkt/common';
import {
  disabled,
  form,
  FormField,
  maxLength,
  minLength,
  required,
  submit,
} from '@angular/forms/signals';
import { CombinedFormErrorsComponent } from 'src/app/components/combined-form-errors/combined-form-errors.component';
import { OutlinedInputComponent } from 'src/app/components/outlined-input/outlined-input.component';
import { BackendService } from 'src/app/services/backend.service';

@Component({
  selector: 'app-news-dialog',
  templateUrl: './news-dialog.component.html',
  styleUrl: './news-dialog.component.scss',
  providers: [provideNativeDateAdapter()],
  imports: [
    FormField,
    CombinedFormErrorsComponent,
    OutlinedInputComponent,
    MatDatepickerModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    TranslatePipe,
    NewsCardComponent,
  ],
})
export class NewsDialogComponent implements AfterViewInit {
  #backend = inject(BackendService);
  #dialogRef = inject<MatDialogRef<NewsDialogComponent, INewsItem>>(MatDialogRef);
  #existing = inject<INewsItem | undefined>(MAT_DIALOG_DATA, { optional: true });
  existing = signal<INewsItem | undefined>(undefined);

  isUploading = signal(false);
  fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  triggerFileInput() {
    const input = this.fileInput();
    if (input) input.nativeElement.click();
    else console.warn('[NewsDialog] fileInput ref is null — element may not be in DOM');
  }

  newsModel = model({
    title: '',
    content: '',
    link: '',
    imageUrl: '',
    published: false,
    date: new Date(),
  });
  newsForm = form(this.newsModel, path => {
    required(path.title);
    minLength(path.title, 3);
    maxLength(path.title, 120);
    required(path.content);
    maxLength(path.content, 240);
    maxLength(path.link, 500);
    disabled(path.imageUrl, {
      when: image => image.value().includes('base64'),
    });
  });

  previewItem = computed<INewsItem>(() => {
    const form = this.newsForm().value();
    const existing = this.existing();
    return {
      _id: existing?._id ?? '',
      title: form.title || 'Preview title',
      content: form.content || 'Preview content text...',
      link: form.link || '',
      imageUrl: form.imageUrl || '',
      author: existing?.author ?? 'You',
      createdBy: existing?.createdBy ?? '',
      published: form.published,
      date: form.date.toISOString(),
    } as INewsItem;
  });

  dateString = computed(() => this.newsForm.date().value().toLocaleDateString('en-US'));
  contentLength = computed(() => this.newsForm.content().value().length);
  maxContentLength = computed(() => this.newsForm.content().maxLength?.() ?? 240);

  #selectedFile = signal<File | undefined>(undefined);
  _selectedFileChangedEffectRef = effect(() => {
    const file = this.#selectedFile();
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      this.newsForm().value.update(data => ({ ...data, imageUrl: e.target?.result as string }));
    };
    reader.readAsDataURL(file);
  });
  async onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.#selectedFile.set(file);
  }

  clearImage() {
    this.#selectedFile.set(undefined);
    this.newsForm().value.update(data => ({ ...data, imageUrl: '' }));
  }

  onDateSelect(event: any) {
    console.log(event);
  }

  async save() {
    let savedItem: INewsItem | undefined = undefined;
    const success = await submit(this.newsForm, async form => {
      const { title, content, link, imageUrl, published, date } = form().value();

      const updatedUrl = await (async () => {
        const file = this.#selectedFile();
        if (file) {
          const result = await this.#backend
            .uploadNewsImage(file)
            .catch(() => ({ error: 'Failed uploading file' }));
          return result;
        }
        return undefined;
      })();

      if (updatedUrl && 'error' in updatedUrl) {
        return {
          kind: 'serverError',
          fieldTree: form,
          message: updatedUrl.error,
        };
      }

      const existing = this.existing();
      const item = existing
        ? await this.#backend
            .updateNews(existing._id.toString(), {
              title,
              content,
              link: link || undefined,
              imageUrl: updatedUrl?.url || imageUrl || undefined,
              published,
              date: date ? date.toISOString() : undefined,
            })
            .catch(() => ({ error: 'Failed updating news item' }))
        : await this.#backend
            .createNews({
              title,
              content,
              link: link || undefined,
              imageUrl: updatedUrl?.url || imageUrl || undefined,
              published,
            })
            .catch(() => ({ error: 'Failed creating news item' }));

      if ('error' in item) {
        return {
          kind: 'serverError',
          fieldTree: form,
          message: item.error,
        };
      }
      savedItem = item;
      return undefined;
    });

    if (!success) return;
    this.#dialogRef.close(savedItem);
  }

  ngAfterViewInit() {
    this.existing.set(this.#existing ?? undefined);
    const existing = this.#existing;
    this.newsForm().value.update(data => ({
      ...data,
      title: existing?.title ?? '',
      content: existing?.content ?? '',
      link: existing?.link ?? '',
      imageUrl: existing?.imageUrl ?? '',
      published: existing?.published ?? false,
      date: existing?.date ? new Date(existing.date) : new Date(),
    }));
  }
}
