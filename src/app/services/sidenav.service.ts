import {
  ElementRef,
  Injectable,
  InputSignal,
  OutputEmitterRef,
  signal,
  Type,
  WritableSignal,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, fromEvent, take } from 'rxjs';

type SidenavState = {
  opened: boolean;
  component: Type<SidenavComponent> | undefined;
  data?: unknown;
};

export interface SidenavComponent {
  title: WritableSignal<string>;
  isHTMLTitle?: boolean;
  resultChanged: OutputEmitterRef<unknown>;
  dataInput: InputSignal<any>;
}

@Injectable({ providedIn: 'root' })
export class SidenavService {
  readonly state = signal<SidenavState>({ opened: false, component: undefined });
  readonly state$ = toObservable(this.state);

  #lastResult = signal<unknown>(undefined);

  constructor() {
    this.state$.subscribe(({ opened }) => {
      document.querySelector('html')!.style.overflow = opened ? 'hidden' : '';
    });
  }

  open(component: Type<SidenavComponent>, data?: unknown) {
    this.state.set({ opened: true, component, data });
  }

  close(result: unknown = undefined) {
    this.#lastResult.set(result);

    this.state.set({ opened: false, component: undefined });
  }

  async openWithResult<R, D = unknown>(
    component: Type<SidenavComponent>,
    data?: D,
  ): Promise<R | undefined> {
    return new Promise<R | undefined>(resolve => {
      this.state.set({ opened: true, component, data });
      requestAnimationFrame(() => {
        this.state$
          .pipe(
            filter(state => !state.opened && !state.component),
            take(1),
          )
          .subscribe(() => {
            const result = this.#lastResult();
            resolve(result as R | undefined);
          });
      });
    });
  }

  setSidenavContainer(elementRef: ElementRef<HTMLDivElement>) {
    fromEvent(elementRef.nativeElement, 'transitionend').subscribe(() => {
      if (this.state().opened) return;
      // Reset the component when the sidenav is closed
      this.state.set({ opened: false, component: undefined });
    });
  }
}
