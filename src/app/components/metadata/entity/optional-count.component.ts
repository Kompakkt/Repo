import { Component, input } from '@angular/core';

@Component({
  selector: 'app-optional-count',
  template: `
    @if (count() > 0) {
      <span>({{ count() }})</span>
    }
  `,
})
export class OptionalCount {
  count = input.required<number>();
}
