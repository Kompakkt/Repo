import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { AnyEntity, FileTuple } from 'src/app/metadata';
import { FilesizePipe, TranslatePipe } from 'src/app/pipes';

@Component({
  selector: 'app-metadata-files',
  standalone: true,
  imports: [
    CommonModule,
    FilesizePipe,
    MatDividerModule,
    MatButtonModule,
    MatIconModule,
    TranslatePipe,
  ],
  templateUrl: './metadata-files.component.html',
  styleUrl: './metadata-files.component.scss',
})
export class MetadataFilesComponent {
  public entity = input.required<AnyEntity>();

  public removeProperty(property: string, index: number) {
    if (Array.isArray(this.entity()[property])) {
      const removed = this.entity()[property].splice(index, 1)[0];
      if (!removed) {
        return console.warn('No item removed');
      }
    } else {
      console.warn(`Could not remove ${property} at ${index} from ${this.entity()}`);
    }
  }

  addMetaDataFiles() {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.hidden = true;
    document.body.appendChild(input);
    input.onchange = () => this.handleFileInput(input).then(() => input.remove());
    input.click();
  }

  public async handleFileInput(fileInput: HTMLInputElement) {
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
      if (!metadataFile) continue;
      this.entity().metadata_files.push(metadataFile);
    }
  }
}
