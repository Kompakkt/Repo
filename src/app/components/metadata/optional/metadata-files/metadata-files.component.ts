import { Component, computed, model } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { IFile, isPhysicalEntity } from '@kompakkt/common';
import { AnyEntity, emptyFileTuple } from 'src/app/metadata';
import { FilesizePipe } from 'src/app/pipes/filesize.pipe';
import { NgxFluentPipe } from '@apappas1129/ngx-fluent';

@Component({
  selector: 'app-metadata-files',
  imports: [FilesizePipe, MatDividerModule, MatButtonModule, MatIconModule, NgxFluentPipe],
  templateUrl: './metadata-files.component.html',
  styleUrl: './metadata-files.component.scss',
})
export class MetadataFilesComponent {
  entity = model.required<AnyEntity>();
  isPhysical = computed(() => isPhysicalEntity(this.entity()));

  removeProperty(index: number) {
    this.entity.update(entity => {
      const clone = structuredClone(entity);
      const arr = [...clone.metadata_files];
      arr.splice(index, 1);
      clone.metadata_files = arr;
      return clone;
    });
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

  async handleFileInput(fileInput: HTMLInputElement) {
    if (!fileInput.files) return alert('Failed getting files');
    const files: File[] = Array.from(fileInput.files);

    const readfile = (_fileToRead: File) =>
      new Promise<IFile | undefined>((resolve, _) => {
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

          const file: IFile = { ...emptyFileTuple(), file_name, file_link, file_size, file_format };

          //console.log('Item content length:', fileContent.length);
          //console.log('File:', file);
          resolve(file);
        };
      });

    const fileTuples = await Promise.all(files.map(file => readfile(file))).then(files =>
      files.filter(v => v !== undefined),
    );
    this.entity.update(entity => {
      const clone = structuredClone(entity);
      const arr = [...clone.metadata_files, ...fileTuples];
      clone.metadata_files = arr;
      return clone;
    });
  }
}
