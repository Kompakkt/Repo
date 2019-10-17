import { Injectable } from '@angular/core';
import { MatProgressBar } from '@angular/material/progress-bar';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ProgressBarService {
  private _progressBar: MatProgressBar | undefined;
  private _pbStateSubject = new BehaviorSubject(false);
  public $progressBarObservable = this._pbStateSubject.asObservable();

  constructor() {
    this.$progressBarObservable.subscribe(enabled => {
      if (!this._progressBar) return;
      if (enabled) {
        this._progressBar._elementRef.nativeElement.classList.add('loading');
      } else {
        this._progressBar._elementRef.nativeElement.classList.remove('loading');
      }
    });
  }

  public setProgressBar(progressBar: MatProgressBar) {
    this._progressBar = progressBar;
  }

  public changeProgressState(value: boolean) {
    this._pbStateSubject.next(value);
  }
}
