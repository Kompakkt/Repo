import {
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  model,
  output,
  viewChildren,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';
import { MatAutocomplete, MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs';
import { TranslatePipe } from 'src/app/pipes';

@Component({
  selector: 'app-outlined-input',
  imports: [MatAutocompleteModule, MatIconModule, TranslatePipe],
  templateUrl: './outlined-input.component.html',
  styleUrl: './outlined-input.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  host: {
    '[class.has-label]': '!!label()',
  },
})
export class OutlinedInputComponent implements FormValueControl<string> {
  label = input<string | undefined>();
  placeholder = input<string | undefined>();
  icon = input<string | undefined>(undefined);
  iconStyle = input<'filled' | 'outlined' | undefined>(undefined);
  autocomplete = input<MatAutocomplete | undefined>(undefined);
  type = input<'text' | 'textarea' | 'password'>('text');
  textareaRows = input<number>(4);

  seperators = input<string[]>([]);
  onSeperator = output<KeyboardEvent>({ alias: 'seperator' });
  onKeyDown = output<KeyboardEvent>({ alias: 'keydown' });

  inputElements = viewChildren<ElementRef<HTMLInputElement | HTMLTextAreaElement>>('inputElement');

  // Browser autofill hints (e.g., "on", "off", "name", "email", etc.)
  // Sometimes name is required for autofill to work, so we provide it as an optional input
  autofillHint = input<string>('on');
  inputName = input<string | undefined>(undefined, { alias: 'name' });

  // Required by FormValueControl; kept in sync with the bound form field or ngModel/formControl
  value = model<string>('');

  // Form state provided by the binding (FormField, ngModel or formControl)
  disabled = input<boolean>(false);
  touch = output<void>();

  _valueChangedEffectRef = effect(() => {
    this.value();
    this.#syncNativeInputValues();
  });

  // MatAutocomplete writes the option's value string directly into the native
  // input on selection, without an input event. If the consumer then writes the
  // same value the model already holds, Angular skips the binding update, so
  // the stale text persists. Re-assert the model value when the panel closes.
  #panelClosedSubscription?: Subscription;
  _panelClosedEffectRef = effect(() => {
    const panel = this.autocomplete();
    this.#panelClosedSubscription?.unsubscribe();
    this.#panelClosedSubscription = panel?.closed.subscribe(() => {
      this.#syncNativeInputValues();
    });
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.#panelClosedSubscription?.unsubscribe());
  }

  #syncNativeInputValues(): void {
    const value = this.value();
    for (const element of this.inputElements()) {
      const nativeElement = element.nativeElement;
      if (nativeElement.value !== value) {
        nativeElement.value = value;
      }
    }
  }

  onInputChange(event: Event): void {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    this.value.set(target.value);
  }

  onKeydown(event: KeyboardEvent): void {
    this.onKeyDown.emit(event);
    if (this.seperators().includes(event.key)) {
      event.preventDefault();
      this.onSeperator.emit(event);
    }
  }
}
