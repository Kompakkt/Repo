import {Injectable} from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class SnackbarService {

  constructor(private _snackbar: MatSnackBar) { }

  public showMessage(message: string, durationInSeconds = 5) {
    this._snackbar.open(message, '', {
      duration: durationInSeconds * 1000,
    });
  }
}
