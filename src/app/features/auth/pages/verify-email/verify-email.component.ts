import { Component, ChangeDetectionStrategy, inject, signal, input, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-verify-email',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './verify-email.component.html',
  styleUrl: './verify-email.component.scss',
})
export class VerifyEmailComponent implements OnInit {
  private readonly authService = inject(AuthService);

  /** Token from query param ?token=xxx via withComponentInputBinding */
  token = input<string>();

  isLoading = signal(true);
  success = signal(false);
  errorMessage = signal('El enlace de verificación es inválido o ha expirado.');

  ngOnInit(): void {
    const tokenValue = this.token();
    if (!tokenValue) {
      this.isLoading.set(false);
      this.errorMessage.set('No se proporcionó un token de verificación.');
      return;
    }

    this.authService.verifyEmail(tokenValue).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.success.set(true);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.success.set(false);
        this.errorMessage.set(
          err.error?.message ?? 'El enlace de verificación es inválido o ha expirado.'
        );
      },
    });
  }
}
