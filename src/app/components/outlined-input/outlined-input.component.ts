
import { Component, computed, forwardRef, input, output } from '@angular/core';
import {
  ControlValueAccessor,
  FormControl,
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatAutocomplete, MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from 'src/app/pipes';

@Component({
  selector: 'app-outlined-input',
  imports: [
    MatAutocompleteModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    TranslatePipe
],
  templateUrl: './outlined-input.component.html',
  styleUrl: './outlined-input.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => OutlinedInputComponent),
      multi: true,
    },
  ],
})
export class OutlinedInputComponent implements ControlValueAccessor {
  // formControl = input.required<FormControl<string>>();
  label = input<string | undefined>();
  placeholder = input<string | undefined>();
  definedPlaceholder = computed(() => this.placeholder() ?? '');
  icon = input<string | undefined>(undefined);
  iconStyle = input<'filled' | 'outlined' | undefined>(undefined);
  autocomplete = input<MatAutocomplete | undefined>(undefined);
  type = input<'text' | 'textarea'>('text');
  textareaRows = input<number>(4);

  // Internal value and control value accessor implementation
  value: string = '';
  disabled = false;

  private onChange = (value: string) => {};
  private onTouched = () => {};

  // ControlValueAccessor methods
  writeValue(value: string): void {
    this.value = value || '';
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
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    this.value = target.value;
    this.onChange(this.value);
  }

  onBlur(): void {
    this.onTouched();
  }
}
