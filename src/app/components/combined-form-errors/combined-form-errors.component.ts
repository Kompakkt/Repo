import { Component, computed, input } from '@angular/core';
import { FieldTree } from '@angular/forms/signals';
import { TranslatePipe } from 'src/app/pipes/translate.pipe';

@Component({
  imports: [TranslatePipe],
  selector: 'app-combined-form-errors',
  styleUrl: './combined-form-errors.component.scss',
  templateUrl: './combined-form-errors.component.html',
  host: {
    '[class.has-errors]': 'filteredErrors().length > 0',
  },
})
export class CombinedFormErrorsComponent {
  form = input.required<FieldTree<unknown>>();
  kinds = input<string[]>(['serverError']);

  filteredErrors = computed(() => {
    const errorSummary = this.form()().errorSummary();
    const kinds = this.kinds();
    const filtered = errorSummary.filter(error => kinds.includes(error.kind));
    const nonEmpty = filtered.filter(
      error => error.message !== undefined && error.message.trim().length > 0,
    );
    if (filtered.length > nonEmpty.length) {
      console.warn('[CombinedFormErrors] Some errors have been filtered due to no error message', {
        filtered,
        nonEmpty,
      });
    }
    return nonEmpty;
  });
}
