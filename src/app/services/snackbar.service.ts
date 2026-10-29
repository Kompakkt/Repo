import { inject, Service } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Service()
export class SnackbarService {
  private snackbar = inject(MatSnackBar);

  public showMessage(message: string, durationInSeconds = 5) {
    return this.snackbar.open(message, 'Ok!', {
      duration: durationInSeconds * 1000,
      panelClass: 'styled-snackbar',
    });
  }

  public showInfo(message: string) {
    if (this.snackbar._openedSnackBarRef) return;
    this.showMessage(message);
  }
}
