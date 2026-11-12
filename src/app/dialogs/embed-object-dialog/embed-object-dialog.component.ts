import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { NgxFluentPipe } from '@apappas1129/ngx-fluent';
import { OutlinedInputComponent } from 'src/app/components/outlined-input/outlined-input.component';
import { ICompilation, IEntity, isCompilation, isDigitalEntity } from '@kompakkt/common';
import { SnackbarService } from 'src/app/services/snackbar.service';
import { DetailPageHelperService } from 'src/app/services/detail-page-helper.service';

@Component({
  selector: 'app-embed-object-dialog',
  templateUrl: './embed-object-dialog.component.html',
  styleUrl: './embed-object-dialog.component.scss',
  imports: [MatButtonModule, MatDialogModule, MatIconModule, OutlinedInputComponent, NgxFluentPipe],
})
export class EmbedObjectDialogComponent {
  data = inject<IEntity | ICompilation>(MAT_DIALOG_DATA);
  #snackbar = inject(SnackbarService);
  #detailPageHelper = inject(DetailPageHelperService);

  elementUrlText = computed(() => {
    let embedHTML: string;
    const iframe = this.iFrameElement();

    if (!iframe) {
      this.#snackbar.showMessage('Could not find viewer');
      return;
    }

    const data = this.data;
    if (!data) {
      this.#snackbar.showMessage('Could not find data');
      return;
    }

    if (isCompilation(data)) {
      embedHTML = iframe.outerHTML;
    } else {
      const title = isDigitalEntity(data?.relatedDigitalEntity)
        ? data.relatedDigitalEntity.title
        : data?.name;
      embedHTML = `
  <iframe
    name="${title}"
    src="${iframe.src}"
    width="560"
    style="aspect-ratio: 16 / 9;"
    allow="fullscreen"
    loading="lazy"
  ></iframe>`
        .trim()
        .split('\n')
        .map(line => line.trim())
        .join('\n');
    }

    return embedHTML;
  });

  elementUrl = computed(() => {
    return this.iFrameElement()?.src;
  });

  iFrameElement = computed(() => {
    return document.querySelector('.iframe-container > iframe') as HTMLIFrameElement | undefined;
  });

  copyEmbed() {
    const embedText = this.elementUrlText() as string;
    this.#detailPageHelper.copyEmbed(embedText);
  }

  copyUrl() {
    const urlText = this.elementUrl() as string;
    this.#detailPageHelper.copyUrl(urlText);
  }
}
