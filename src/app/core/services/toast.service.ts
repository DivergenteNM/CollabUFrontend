import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string): void {
    this.snackBar.open(message, '✕', {
      duration: 4000,
      panelClass: 'toast-success',
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
    });
  }

  error(message: string): void {
    this.snackBar.open(message, '✕', {
      duration: 6000,
      panelClass: 'toast-error',
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
    });
  }

  warning(message: string): void {
    this.snackBar.open(message, '✕', {
      duration: 5000,
      panelClass: 'toast-warning',
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
    });
  }

  info(message: string): void {
    this.snackBar.open(message, '✕', {
      duration: 4000,
      panelClass: 'toast-info',
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
    });
  }
}
