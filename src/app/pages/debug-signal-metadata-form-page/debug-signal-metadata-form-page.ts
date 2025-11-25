import { Component, effect, signal } from '@angular/core';
import { ValidationError } from '@angular/forms/signals';
import { createDigitalEntity } from 'src/app/components/signal-metadata/index';
import { SignalEntityComponent } from 'src/app/components/signal-metadata/signal-entity/signal-entity.component';
import { IDigitalEntity } from 'src/common';

@Component({
  selector: 'app-debug-signal-metadata-form-page',
  imports: [SignalEntityComponent],
  templateUrl: './debug-signal-metadata-form-page.html',
  styleUrl: './debug-signal-metadata-form-page.scss',
})
export class DebugSignalMetadataFormPage {
  digitalEntity = signal<IDigitalEntity<Record<string, unknown>, true> | undefined>(undefined);
  errors = signal<ValidationError.WithField[]>([]);

  onEntityChanged(event: {
    value: IDigitalEntity<Record<string, unknown>, true>;
    errors: ValidationError.WithField[];
  }) {
    this.digitalEntity.set(event.value);
    this.errors.set(event.errors);
  }

  constructor() {
    effect(() => {
      for (const error of this.errors()) {
        try {
          const key = error.field().keyInParent();
          console.log(error.message, key);
        } catch {
          console.log(error.message, 'root');
        }
      }
    });
  }
}
