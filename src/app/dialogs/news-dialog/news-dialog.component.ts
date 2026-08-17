import { Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from 'src/app/pipes';
import { BackendService } from 'src/app/services';
import { NewsCardComponent } from 'src/app/components/news-card/news-card.component';
import type { INewsItem } from '@kompakkt/common';

@Component({
  selector: 'app-news-dialog',
  templateUrl: './news-dialog.component.html',
  styleUrl: './news-dialog.component.scss',
  imports: [
    FormsModule,
    ReactiveFormsModule,
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
export class NewsDialogComponent {
  #backend = inject(BackendService);
  #dialogRef = inject<MatDialogRef<NewsDialogComponent, INewsItem>>(MatDialogRef);
  existing = inject<INewsItem | undefined>(MAT_DIALOG_DATA, { optional: true });

  isUploading = signal(false);
  imagePreviewUrl = signal<string>('');

  fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  triggerFileInput() {
    console.log('[NewsDialog] triggerFileInput called');
    const input = this.fileInput();
    console.log('[NewsDialog] fileInput ref:', input);
    if (input) {
      console.log('[NewsDialog] nativeElement:', input.nativeElement);
      input.nativeElement.click();
      console.log('[NewsDialog] click() called on file input');
    } else {
      console.warn('[NewsDialog] fileInput ref is null — element may not be in DOM');
    }
  }

  newsFormGroup = new FormGroup({
    title: new FormControl('', {
      validators: [Validators.required, Validators.minLength(3), Validators.maxLength(120)],
      nonNullable: true,
    }),
    content: new FormControl('', {
      validators: [Validators.required, Validators.maxLength(240)],
      nonNullable: true,
    }),
    link: new FormControl('', {
      validators: [Validators.maxLength(500)],
      nonNullable: true,
    }),
    imageUrl: new FormControl('', {
      validators: [Validators.maxLength(500)],
      nonNullable: true,
    }),
    published: new FormControl(false, { nonNullable: true }),
  });

  previewItem = computed<INewsItem>(() => {
    const form = this.newsFormGroup.getRawValue();
    return {
      _id: this.existing?._id ?? '',
      title: form.title || 'Preview title',
      content: form.content || 'Preview content text...',
      link: form.link || '',
      imageUrl: form.imageUrl || this.imagePreviewUrl() || '',
      author: this.existing?.author ?? 'You',
      createdBy: this.existing?.createdBy ?? '',
      published: form.published,
      date: this.existing?.date ?? new Date().toISOString(),
    } as INewsItem;
  });

  get contentLength() {
    return this.newsFormGroup.controls.content.value.length;
  }

  get maxContentLength() {
    return 240;
  }

  async onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      this.imagePreviewUrl.set(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    this.isUploading.set(true);
    try {
      const result = await this.#backend.uploadNewsImage(file);
      this.newsFormGroup.controls.imageUrl.setValue(result.url);
      this.imagePreviewUrl.set(result.url);
    } catch (err) {
      console.error('Failed to upload news image:', err);
    } finally {
      this.isUploading.set(false);
    }
  }

  clearImage() {
    this.newsFormGroup.controls.imageUrl.setValue('');
    this.imagePreviewUrl.set('');
  }

  async save() {
    if (!this.newsFormGroup.valid) {
      this.newsFormGroup.markAllAsTouched();
      return;
    }

    const { title, content, link, imageUrl, published } = this.newsFormGroup.getRawValue();

    try {
      if (this.existing) {
        const updated = await this.#backend.updateNews(this.existing._id.toString(), {
          title,
          content,
          link: link || undefined,
          imageUrl: imageUrl || undefined,
          published,
        });
        this.#dialogRef.close(updated);
      } else {
        const created = await this.#backend.createNews({
          title,
          content,
          link: link || undefined,
          imageUrl: imageUrl || undefined,
          published,
        });
        this.#dialogRef.close(created);
      }
    } catch (err) {
      console.error('Failed to save news item:', err);
    }
  }

  ngOnInit() {
    if (this.existing) {
      this.newsFormGroup.patchValue({
        title: this.existing.title,
        content: this.existing.content,
        link: this.existing.link ?? '',
        imageUrl: this.existing.imageUrl ?? '',
        published: this.existing.published,
      });
      this.imagePreviewUrl.set(this.existing.imageUrl ?? '');
    }
  }
}
