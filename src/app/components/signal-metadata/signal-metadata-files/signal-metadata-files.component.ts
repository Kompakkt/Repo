import { Component, ElementRef, input, signal, viewChild } from '@angular/core';
import { IDigitalEntityForm } from '../base-signal-child-component';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { FilesizePipe, TranslatePipe } from 'src/app/pipes';
import { FileTuple } from 'src/app/metadata';
import { SignalCardComponent } from '../signal-card/signal-card.component';

@Component({
  selector: 'app-signal-metadata-files',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    TranslatePipe,
    FilesizePipe,
    SignalCardComponent,
  ],
  templateUrl: './signal-metadata-files.component.html',
  styleUrl: './signal-metadata-files.component.scss',
})
export class SignalMetadataFilesComponent {
  entityForm = input.required<IDigitalEntityForm>();

  fileErrors = signal<{ name: string; errorType: 'filesize' }[]>([]);

  async handleFileInput(event: Event) {
    const fileInput = event.target as HTMLInputElement;
    if (!('files' in fileInput)) {
      alert('Failed getting files');
      return;
    }
    if (!fileInput.files) return alert('Failed getting files');
    const files: File[] = Array.from(fileInput.files);

    const readfile = (_fileToRead: File) =>
      new Promise<FileTuple | undefined>((resolve, _) => {
        const reader = new FileReader();
        reader.readAsText(_fileToRead);

        reader.onloadend = () => {
          const fileContent = reader.result as string | null;
          if (!fileContent) {
            console.error('Failed reading file content');
            return resolve(undefined);
          }

          const file_name = _fileToRead.name;
          const file_link = fileContent;
          const file_size = _fileToRead.size;
          const file_format = _fileToRead.name.includes('.')
            ? _fileToRead.name.slice(_fileToRead.name.indexOf('.'))
            : _fileToRead.name;

          const file = new FileTuple({
            file_name,
            file_link,
            file_size,
            file_format,
          });

          //console.log('Item content length:', fileContent.length);
          //console.log('File:', file);
          resolve(file);
        };
      });

    for (const file of files) {
      const metadataFile = await readfile(file);

      // 16 MB limit
      if (file.size > 16 * 1024 * 1024) {
        this.fileErrors.update(errors => [...errors, { name: file.name, errorType: 'filesize' }]);
        continue;
      }

      if (!metadataFile) continue;
      this.entityForm()
        .metadata_files()
        .value.update(currentFiles => [...currentFiles, metadataFile]);
    }
  }

  removeFile(index: number) {
    this.entityForm()
      .metadata_files()
      .value.update(files => {
        const newFiles = [...this.entityForm().metadata_files().value()];
        newFiles.splice(index, 1);
        return newFiles;
      });
  }
}
