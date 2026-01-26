import {
  Component,
  computed,
  effect,
  input,
  model,
  output,
  signal,
  WritableSignal,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { distinctUntilChanged, pairwise } from 'rxjs';
import { TranslatePipe } from 'src/app/pipes';
import { MathPipe } from 'src/app/pipes/math.pipe';

export type Pagination = {
  pageCount: number;
  pageSize: number;
  pageIndex: number;
  totalItemCount: number;
};

@Component({
  selector: 'app-pagination',
  imports: [MatIconModule, MatButtonModule, TranslatePipe, MathPipe],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.scss',
})
export class PaginationComponent {
  pagination = model.required<Pagination>();

  canNavigatePrevious = computed(() => {
    const { pageIndex } = this.pagination();
    return pageIndex > 0;
  });
  public previousPage() {
    this.pagination.update(state => ({
      ...state,
      pageIndex: Math.max(0, state.pageIndex - 1),
    }));
  }

  canNavigateNext = computed(() => {
    const { pageIndex, pageCount } = this.pagination();
    return pageIndex + 1 < pageCount;
  });
  public nextPage() {
    this.pagination.update(state => ({
      ...state,
      pageIndex: state.pageIndex + 1,
    }));
  }

  canNavigateFirst = computed(() => {
    const { pageIndex } = this.pagination();
    return pageIndex > 0;
  });
  public firstPage() {
    this.pagination.update(state => ({
      ...state,
      pageIndex: 0,
    }));
  }

  canNavigateLast = computed(() => {
    const { pageIndex, pageCount } = this.pagination();
    return pageIndex + 1 < pageCount;
  });
  public lastPage() {
    this.pagination.update(state => ({
      ...state,
      pageIndex: state.pageCount - 1,
    }));
  }
}
