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

@Component({
  selector: 'app-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule, MatIconModule, MatButtonModule, MatCardModule,
    MatTabsModule, MatSlideToggleModule, MatRadioModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDividerModule, MatSnackBarModule,
  ],
  template: `
    <div class="settings">
      <h1>Configuración</h1>

      <mat-tab-group>
        <!-- Tab: Notifications -->
        <mat-tab label="Notificaciones">
          <div class="tab-content">
            <mat-card>
              <mat-card-content>
                <h3>Preferencias de Notificaciones</h3>

                <div class="toggle-row">
                  <div class="toggle-info">
                    <strong>Notificaciones por email</strong>
                    <span>Recibe actualizaciones en tu correo electrónico</span>
                  </div>
                  <mat-slide-toggle
                    [ngModel]="prefs().emailNotifications"
                    (ngModelChange)="updatePref('emailNotifications', $event)" />
                </div>

                <div class="toggle-row">
                  <div class="toggle-info">
                    <strong>Notificaciones push</strong>
                    <span>Notificaciones en el navegador</span>
                  </div>
                  <mat-slide-toggle
                    [ngModel]="prefs().pushNotifications"
                    (ngModelChange)="updatePref('pushNotifications', $event)" />
                </div>

                <div class="toggle-row">
                  <div class="toggle-info">
                    <strong>Chat</strong>
                    <span>Notificaciones de nuevos mensajes</span>
                  </div>
                  <mat-slide-toggle
                    [ngModel]="prefs().chatNotifications"
                    (ngModelChange)="updatePref('chatNotifications', $event)" />
                </div>

                <div class="toggle-row">
                  <div class="toggle-info">
                    <strong>Aplicaciones</strong>
                    <span>Actualizaciones de estado de aplicaciones</span>
                  </div>
                  <mat-slide-toggle
                    [ngModel]="prefs().applicationUpdates"
                    (ngModelChange)="updatePref('applicationUpdates', $event)" />
                </div>

                <div class="toggle-row">
                  <div class="toggle-info">
                    <strong>Recomendaciones</strong>
                    <span>Nuevos proyectos recomendados</span>
                  </div>
                  <mat-slide-toggle
                    [ngModel]="prefs().projectRecommendations"
                    (ngModelChange)="updatePref('projectRecommendations', $event)" />
                </div>

                <div class="toggle-row">
                  <div class="toggle-info">
                    <strong>Evaluaciones</strong>
                    <span>Cuando recibes una evaluación</span>
                  </div>
                  <mat-slide-toggle
                    [ngModel]="prefs().evaluationAlerts"
                    (ngModelChange)="updatePref('evaluationAlerts', $event)" />
                </div>

                <div class="toggle-row">
                  <div class="toggle-info">
                    <strong>Resumen semanal</strong>
                    <span>Recibe un resumen de actividad cada lunes</span>
                  </div>
                  <mat-slide-toggle
                    [ngModel]="prefs().weeklyDigest"
                    (ngModelChange)="updatePref('weeklyDigest', $event)" />
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Tab: Account -->
        <mat-tab label="Cuenta">
          <div class="tab-content">
            <mat-card>
              <mat-card-content>
                <h3>Información de la cuenta</h3>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Email</mat-label>
                  <input matInput [value]="authStore.user()?.email ?? ''" readonly />
                  <mat-icon matSuffix>lock</mat-icon>
                </mat-form-field>

                <mat-divider />

                <h3>Seguridad</h3>

                <button mat-stroked-button (click)="changePassword()">
                  <mat-icon>lock</mat-icon>
                  Cambiar contraseña
                </button>

                <mat-divider />

                <h3 class="danger-section">Zona de peligro</h3>

                <button mat-stroked-button color="warn" (click)="deactivateAccount()">
                  <mat-icon>person_off</mat-icon>
                  Desactivar cuenta
                </button>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Tab: Appearance -->
        <mat-tab label="Apariencia">
          <div class="tab-content">
            <mat-card>
              <mat-card-content>
                <h3>Tema</h3>
                <mat-radio-group
                  [ngModel]="uiStore.theme()"
                  (ngModelChange)="uiStore.setTheme($event)">
                  <mat-radio-button value="light">
                    <mat-icon>light_mode</mat-icon>
                    Claro
                  </mat-radio-button>
                  <mat-radio-button value="dark">
                    <mat-icon>dark_mode</mat-icon>
                    Oscuro
                  </mat-radio-button>
                  <mat-radio-button value="system">
                    <mat-icon>settings_brightness</mat-icon>
                    Sistema
                  </mat-radio-button>
                </mat-radio-group>

                <mat-divider />

                <h3>Idioma</h3>
                <mat-form-field appearance="outline">
                  <mat-label>Idioma de la interfaz</mat-label>
                  <mat-select value="es">
                    <mat-option value="es">Español</mat-option>
                    <mat-option value="en">English</mat-option>
                  </mat-select>
                </mat-form-field>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: `
    .settings {
      max-width: 700px;
      margin: 0 auto;

      h1 {
        font-size: 1.75rem;
        font-weight: 500;
        margin-bottom: 24px;
      }
    }

    .tab-content {
      padding: 16px 0;
    }

    h3 {
      font-size: 1rem;
      font-weight: 600;
      margin: 16px 0 12px;

      &.danger-section {
        color: var(--mat-sys-error);
      }
    }

    .toggle-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid var(--mat-sys-outline-variant);

      &:last-child {
        border-bottom: none;
      }
    }

    .toggle-info {
      strong {
        display: block;
        font-size: 0.9375rem;
      }

      span {
        font-size: 0.8125rem;
        color: var(--mat-sys-on-surface-variant);
      }
    }

    .full-width {
      width: 100%;
    }

    mat-divider {
      margin: 16px 0;
    }

    mat-radio-group {
      display: flex;
      flex-direction: column;
      gap: 12px;

      mat-radio-button {
        mat-icon {
          vertical-align: middle;
          margin-right: 4px;
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
      }
    }

    button[color="warn"] {
      margin-top: 8px;
    }
  `,
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
      this.prefs.set(resp.data);
    });
  }

  updatePref(key: keyof NotificationPreferences, value: boolean): void {
    this.prefs.update(p => ({ ...p, [key]: value }));
    this.notificationService.updatePreferences({ [key]: value }).subscribe({
      next: () => this.snackBar.open('Preferencia actualizada', 'Cerrar', { duration: 2000 }),
    });
  }

  changePassword(): void {
    this.snackBar.open('Funcionalidad de cambio de contraseña próximamente', 'Cerrar', { duration: 3000 });
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
