import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class SnackbarService {
  constructor(private _snackbar: MatSnackBar) {}

  public showMessage(message: string, durationInSeconds = 5) {
    return this._snackbar.open(message, '', {
      duration: durationInSeconds * 1000,
      panelClass: 'styled-snackbar',
    });
  }

  public showInfo(message: string) {
    if (this._snackbar._openedSnackBarRef) return;
    this.showMessage(message);
  }
}
