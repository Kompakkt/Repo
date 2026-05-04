import {
  Component,
  computed,
  effect,
  ElementRef,
  forwardRef,
  input,
  output,
  signal,
  viewChildren,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatAutocomplete, MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from 'src/app/pipes';

@Component({
  selector: 'app-outlined-input',
  imports: [MatAutocompleteModule, FormsModule, ReactiveFormsModule, MatIconModule, TranslatePipe],
  templateUrl: './outlined-input.component.html',
  styleUrl: './outlined-input.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => OutlinedInputComponent),
      multi: true,
    },
  ],
  host: {
    '[class.has-label]': 'hasLabel()',
  },
})
export class OutlinedInputComponent implements ControlValueAccessor {
  label = input<string | undefined>();
  hasLabel = computed(() => !!this.label());
  placeholder = input<string | undefined>();
  definedPlaceholder = computed(() => this.placeholder() ?? '');
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
  name = input<string | undefined>(undefined);

  // Track which value changes are from our inputs vs from external sources
  #expectedValueChange = signal(false);

  // Internal value and control value accessor implementation
  value = signal<string>('');
  disabled = false;

  _valueChangedEffectRef = effect(() => {
    const value = this.value();
    this.onChange(value);
    const expected = this.#expectedValueChange();
    if (expected) {
      this.#expectedValueChange.set(false);
      return;
    }
    this.#updateInputElementValues(value);
  });

  #updateInputElementValues(value: string) {
    const inputElements = this.inputElements();
    inputElements.forEach(element => {
      const nativeElement = element.nativeElement;
      if (nativeElement.value !== value) {
        nativeElement.value = value;
      }
    });
  }

  private onChange = (value: string) => {};
  private onTouched = () => {};

  // ControlValueAccessor methods
  writeValue(value: string): void {
    this.value.set(value || '');
    //To be sure to update the native input properly
    // (issue with displaying id + ,person sometimes when autocomplete by prename)
    this.#updateInputElementValues(value);
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  // Handle input changes
  onInputChange(event: Event): void {
    this.#expectedValueChange.set(true);
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    this.value.set(target.value);
  }

  onBlur(): void {
    this.onTouched();
  }

  onKeydown(event: KeyboardEvent): void {
    this.onKeyDown.emit(event);
    if (this.seperators().includes(event.key)) {
      event.preventDefault();
      this.onSeperator.emit(event);
    }
  }
}
