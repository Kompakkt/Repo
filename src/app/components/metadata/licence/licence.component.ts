import { Component, computed, input, output, signal } from '@angular/core';

import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';

import { OutlinedInputComponent } from '../../outlined-input/outlined-input.component';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { FormsModule } from '@angular/forms';
import { isFreeLicence, Licences } from '../../../metadata/licences';
import { DigitalEntity } from 'src/app/metadata';
import { KeyValuePipe } from '@angular/common';

@Component({
  selector: 'app-licence',
  imports: [
    FormsModule,
    KeyValuePipe,
    MatIconModule,
    MatRadioModule,
    OutlinedInputComponent,
    TranslatePipe,
  ],
  templateUrl: './licence.component.html',
  styleUrl: './licence.component.scss',
})
export class LicenceComponent {
  entity = input<DigitalEntity>();
  licenceChange = output<string>();
  attributionChange = output<string>();
  currentLicenceKey = signal<string>('');

  public availableLicences = Licences;

  requiresAttribution = computed(() => {
    const key = this.currentLicenceKey() || this.entity()?.licence || '';
    return !isFreeLicence(key);
  });

  onLicenceChange(key: string) {
    const entity = this.entity();
    if (entity) entity.licence = key;
    this.currentLicenceKey.set(key);
    this.licenceChange.emit(key);
  }

  onAttributionChange(value: string) {
    const entity = this.entity();
    if (entity) entity.licenceAttribution = value;
    this.attributionChange.emit(value);
  }
}
