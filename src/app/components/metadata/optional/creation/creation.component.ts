import { formatDate } from '@angular/common';
import { Component, effect, model } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NgxFluentPipe } from '@apappas1129/ngx-fluent';
import { OptionalCardListComponent } from '../optional-card-list/optional-card-list.component';
import { OutlinedInputComponent } from 'src/app/components/outlined-input/outlined-input.component';
import { form, FormField, submit, validateTree } from '@angular/forms/signals';
import { IDigitalEntityResolved } from '@kompakkt/common';
import { emptyCreationTuple } from 'src/app/metadata';

type CreationModel = {
  technique: string;
  software: string;
  equipment: string;
  start: Date | null;
  end: Date | null;
};

@Component({
  selector: 'app-creation',
  imports: [
    FormField,
    MatButtonModule,
    MatDatepickerModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    NgxFluentPipe,
    OptionalCardListComponent,
    OutlinedInputComponent,
  ],
  templateUrl: './creation.component.html',
  styleUrl: './creation.component.scss',
  providers: [provideNativeDateAdapter()],
})
export class CreationComponent {
  entity = model.required<IDigitalEntityResolved>();

  creationModel = model<CreationModel>({
    technique: '',
    software: '',
    equipment: '',
    start: null,
    end: null,
  });
  creationForm = form(this.creationModel, path => {
    validateTree(path, ctx => {
      const hasText =
        (
          ctx.valueOf(path.equipment) +
          ctx.valueOf(path.software) +
          ctx.valueOf(path.technique)
        ).trim().length > 0;
      const hasDate = ctx.valueOf(path.start) !== null && ctx.valueOf(path.end) !== null;
      if (!hasText && !hasDate)
        return {
          kind: 'noValue',
          message: 'Either a technique, software, equipment, starting date or date range is needed',
        };
      return null;
    });
  });

  _formatDateRangeEffectRef = effect(() => {
    const { start, end } = this.creationForm().value();
    if (start && end)
      this.dateRangeForm().value.set(`${start.toLocaleDateString()} – ${end.toLocaleDateString()}`);
  });

  async addNewCreationData() {
    const success = await submit(this.creationForm, async field => {
      const { start, end, software, technique, equipment } = field().value();
      const formattedDate =
        start && end
          ? `${formatDate(start, 'MM/dd/yyyy', 'en-US')} - ${formatDate(end, 'MM/dd/yyyy', 'en-US')}`
          : '';
      const creationInstance = {
        ...emptyCreationTuple(),
        technique: technique ?? '',
        program: software ?? '',
        equipment: equipment ?? '',
        date: formattedDate,
      };
      this.entity.update(entity => ({
        ...entity,
        creation: [...entity.creation, creationInstance],
      }));
    });
    if (success) this.resetFormFields();
  }

  resetFormFields() {
    this.creationForm().value.set({
      end: null,
      equipment: '',
      software: '',
      start: null,
      technique: '',
    });
    this.dateRangeForm().value.set('');
  }

  dateRangeModel = model<string>('');
  dateRangeForm = form(this.dateRangeModel);

  onDateInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    const parts = value.split(/\s*[–-]\s*/).map(s => s.trim());
    if (parts.length !== 2) return;

    const start = this.parseDate(parts[0]);
    const end = this.parseDate(parts[1]);

    if (start && end) {
      this.creationForm.start().value.set(start);
      this.creationForm.end().value.set(end);
      this.dateRangeForm().value.set(value);
    }
  }

  private parseDate(str: string): Date | null {
    const [day, month, year] = str.split('.').map(Number);
    if (!day || !month || !year) return null;

    const fullYear = year < 100 ? 2000 + year : year;

    const date = new Date(fullYear, month - 1, day);
    return isNaN(date.getTime()) ? null : date;
  }
}
