import { formatDate } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { CreationTuple, DigitalEntity } from 'src/app/metadata';
import { TranslatePipe } from '../../../../pipes/translate.pipe';
import { OptionalCardListComponent } from '../optional-card-list/optional-card-list.component';

import { OutlinedInputComponent } from 'src/app/components/outlined-input/outlined-input.component';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-creation',
  standalone: true,
  imports: [
    MatButtonModule,
    MatDatepickerModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    TranslatePipe,
    OptionalCardListComponent,
    OutlinedInputComponent,
  ],
  templateUrl: './creation.component.html',
  styleUrl: './creation.component.scss',
  providers: [provideNativeDateAdapter()],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreationComponent implements OnInit {
  public entity = input.required<DigitalEntity>();

  form = new FormGroup({
    technique: new FormControl(''),
    software: new FormControl(''),
    equipment: new FormControl(''),
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });

  dateRangeDisplay = '';

  private readonly _formValues = toSignal(this.form.valueChanges, {
    initialValue: this.form.value,
  });
  private readonly _currentYear = new Date().getFullYear();
  readonly minDate = new Date(this._currentYear - 20, 0, 1);

  addNewCreationData() {
    const value = this.form.value;

    let formattedDate = '';
    if (value.start && value.end) {
      const startStr = formatDate(value.start, 'MM/dd/yyyy', 'en-US');
      const endStr = formatDate(value.end, 'MM/dd/yyyy', 'en-US');
      formattedDate = `${startStr} - ${endStr}`;
    }

    const creationInstance = new CreationTuple({
      technique: value.technique ?? '',
      program: value.software ?? '',
      equipment: value.equipment ?? '',
      date: formattedDate,
    });

    this.resetFormFields();
    this.entity().creation.push(creationInstance);
  }

  isFormValid = computed(() => {
    const v = this._formValues();
    return !!v.technique || !!v.software || !!v.equipment || (!!v.start && !!v.end);
  });

  resetFormFields() {
    this.form.reset();
    this.dateRangeDisplay = '';
  }

  dateRangeForm = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });

  onDateInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    const parts = value.split(/\s*[–-]\s*/).map(s => s.trim());
    if (parts.length !== 2) return;

    const start = this.parseDate(parts[0]);
    const end = this.parseDate(parts[1]);

    if (start && end) {
      this.form.patchValue({ start, end });
      this.dateRangeDisplay = value;
    }
  }

  private parseDate(str: string): Date | null {
    const [day, month, year] = str.split('.').map(Number);
    if (!day || !month || !year) return null;

    const fullYear = year < 100 ? 2000 + year : year;

    const date = new Date(fullYear, month - 1, day);
    return isNaN(date.getTime()) ? null : date;
  }

  ngOnInit(): void {
    this.form.valueChanges.subscribe(({ start, end }) => {
      if (start && end) {
        this.dateRangeDisplay = `${start.toLocaleDateString()} – ${end.toLocaleDateString()}`;
      }
    });
  }
}
