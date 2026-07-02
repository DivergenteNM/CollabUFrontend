import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatRadioModule } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UiStore } from '../../../../state/ui.store';
import { AuthStore } from '../../../../state/auth.store';
import { NotificationService } from '../../../notifications/services/notification.service';
import { NotificationPreferences } from '../../../../core/models';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../shared/components/ui/confirm-dialog/confirm-dialog.component';
import { ChangePasswordDialogComponent } from '../../components/change-password-dialog/change-password-dialog.component';

@Component({
  selector: 'app-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule, MatIconModule, MatButtonModule, MatCardModule,
    MatTabsModule, MatSlideToggleModule, MatRadioModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDividerModule, MatSnackBarModule,
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent implements OnInit {
  readonly uiStore = inject(UiStore);
  readonly authStore = inject(AuthStore);
  private readonly notificationService = inject(NotificationService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly prefs = signal<NotificationPreferences>({
    emailNotifications: true,
    pushNotifications: true,
    chatNotifications: true,
    applicationUpdates: true,
    projectRecommendations: true,
    evaluationAlerts: true,
    weeklyDigest: false,
  });

  ngOnInit(): void {
    this.notificationService.getPreferences().subscribe((resp) => {
      if (resp.data) {
        this.prefs.set(resp.data);
      }
    });
  }

  updatePref(key: keyof NotificationPreferences, value: boolean): void {
    this.prefs.update(p => ({ ...p, [key]: value }));
    this.notificationService.updatePreferences({ [key]: value }).subscribe({
      next: () => this.snackBar.open('Preferencia actualizada', 'Cerrar', { duration: 2000 }),
    });
  }

  changePassword(): void {
    const ref = this.dialog.open(ChangePasswordDialogComponent, {
      width: '450px',
      disableClose: true,
    });

    ref.afterClosed().subscribe((success) => {
      if (success) {
        this.snackBar.open('Contraseña cambiada exitosamente', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
        });
      }
    });
  }

  deactivateAccount(): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Desactivar Cuenta',
        message: '¿Estás seguro de que deseas desactivar tu cuenta? Esta acción se puede revertir contactando soporte.',
        confirmText: 'Desactivar',
        type: 'danger',
      } satisfies ConfirmDialogData,
    });

    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.snackBar.open('Cuenta desactivada (simulado)', 'Cerrar', { duration: 3000 });
      }
    });
  }
}
