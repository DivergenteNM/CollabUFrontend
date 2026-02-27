import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-register',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div class="register-select">
      <h2 class="register-select__heading">Crear nueva cuenta</h2>
      <p class="register-select__sub">Selecciona tu tipo de cuenta:</p>

      <div class="register-select__cards">
        <mat-card appearance="outlined" class="register-select__card" routerLink="/auth/register/student">
          <mat-card-content>
            <mat-icon class="register-select__icon">school</mat-icon>
            <h3>Estudiante</h3>
            <p>Busca prácticas profesionales y conecta con empresas</p>
          </mat-card-content>
        </mat-card>

        <mat-card appearance="outlined" class="register-select__card" routerLink="/auth/register/company">
          <mat-card-content>
            <mat-icon class="register-select__icon">business</mat-icon>
            <h3>Empresa</h3>
            <p>Publica proyectos y conecta con talento universitario</p>
          </mat-card-content>
        </mat-card>
      </div>

      <p class="register-select__login">
        ¿Ya tienes cuenta?
        <a routerLink="/auth/login">Inicia sesión</a>
      </p>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .register-select {
      text-align: center;
    }

    .register-select__heading {
      font-size: 22px;
      font-weight: 600;
      margin: 0 0 4px;
      color: var(--mat-sys-on-surface);
    }

    .register-select__sub {
      font-size: 14px;
      color: var(--mat-sys-on-surface-variant);
      margin: 0 0 24px;
    }

    .register-select__cards {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
    }

    .register-select__card {
      flex: 1;
      cursor: pointer;
      transition: border-color 0.2s, box-shadow 0.2s;
      text-align: center;
      padding: 16px 8px;

      &:hover {
        border-color: var(--mat-sys-primary);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      }

      h3 {
        font-size: 16px;
        font-weight: 600;
        margin: 8px 0 4px;
      }

      p {
        font-size: 13px;
        color: var(--mat-sys-on-surface-variant);
        margin: 0;
      }
    }

    .register-select__icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: var(--mat-sys-primary);
    }

    .register-select__login {
      font-size: 14px;
      color: var(--mat-sys-on-surface-variant);
      margin: 0;

      a {
        color: var(--mat-sys-primary);
        font-weight: 500;
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }
    }

    @media (max-width: 400px) {
      .register-select__cards {
        flex-direction: column;
      }
    }
  `,
})
export class RegisterComponent {}
