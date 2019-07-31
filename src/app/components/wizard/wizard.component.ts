import { Component, AfterViewInit } from '@angular/core';
import { UploadHandlerService } from '../../services/upload-handler.service';

import { baseDigital, baseEntity } from '../metadata/base-objects';

@Component({
  selector: 'app-wizard',
  templateUrl: './wizard.component.html',
  styleUrls: ['./wizard.component.scss'],
})
export class WizardComponent implements AfterViewInit {

  public UploadResult: any | undefined;
  public SettingsResult: any | undefined;

  public entity = {...baseEntity(), ...baseDigital()};

  constructor(public uploadHandler: UploadHandlerService) {
    window.onmessage = message => {
      const type = message.data.type;
      switch (type) {
        case 'resetQueue': this.uploadHandler.resetQueue(); break;
        case 'addFile': this.uploadHandler.addToQueue(message.data.file); break;
        case 'fileList':
          this.uploadHandler.addMultipleToQueue(message.data.files);
          this.uploadHandler.setMediaType(message.data.mediaType);
          break;
        case 'settings': this.SettingsResult = message.data.settings;
        default: console.log(message.data);
      }
    };

    this.uploadHandler.$UploadResult.subscribe(result => this.UploadResult = result);
  }

  ngAfterViewInit() {
  }

  public validateEntity() {
    console.log(this.entity);
  }

}
