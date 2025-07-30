import { Injectable } from '@angular/core';
import { MatProgressBar } from '@angular/material/progress-bar';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ProgressBarService {
  #progressBar: MatProgressBar | undefined;
  readonly progressState$ = new BehaviorSubject(new Set<string>());

  constructor() {
    this.progressState$.subscribe(value => {
      if (!this.#progressBar) return;
      if (value.size > 0) {
        this.#progressBar._elementRef.nativeElement.classList.add('loading');
      } else {
        this.#progressBar._elementRef.nativeElement.classList.remove('loading');
      }
    });
  }

  public setProgressBar(progressBar: MatProgressBar) {
    this.#progressBar = progressBar;
  }

  public addProcess(url: string) {
    const currentValue = this.progressState$.getValue();
    this.progressState$.next(new Set(currentValue).add(url));
  }

  public removeProcess(url: string) {
    const currentValue = this.progressState$.getValue();
    currentValue.delete(url);
    this.progressState$.next(new Set(currentValue));
  }
}
