import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { StorageService } from '../../../../core/services/storage.service';
import { UserProfileService } from '../../../../core/services/user-profile.service';
import { AuthStore } from '../../../../state/auth.store';
import { environment } from '../../../../../environments/environment';
import { AvatarCropDialogComponent } from '../avatar-crop-dialog/avatar-crop-dialog.component';

@Component({
  selector: 'app-avatar-upload',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './avatar-upload.component.html',
  styleUrl: './avatar-upload.component.scss',
})
export class AvatarUploadComponent {
  readonly currentAvatarUrl = input<string | null | undefined>(null);
  readonly size = input<number>(120); // Avatar diameter in px
  readonly avatarChanged = output<string | null>();

  readonly dialog = inject(MatDialog);
  readonly storageService = inject(StorageService);
  readonly userProfileService = inject(UserProfileService);
  readonly authStore = inject(AuthStore);

  readonly uploading = signal<boolean>(false);
  readonly errorMsg = signal<string | null>(null);

  get initials(): string {
    const profile = this.authStore.profile();
    if (profile?.firstName && profile?.lastName) {
      return `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase();
    }
    if (profile?.firstName) {
      return profile.firstName[0].toUpperCase();
    }
    return 'U';
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    input.value = ''; // Reset input selection

    if (!file.type.startsWith('image/')) {
      this.errorMsg.set('Selecciona un archivo de imagen válido (.jpg, .png, .webp)');
      return;
    }

    this.openCropDialog(file);
  }

  private openCropDialog(file: File): void {
    const dialogRef = this.dialog.open(AvatarCropDialogComponent, {
      data: { imageFile: file },
      width: '380px',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((croppedFile: File | null) => {
      if (croppedFile) {
        this.uploadCroppedAvatar(croppedFile);
      }
    });
  }

  private uploadCroppedAvatar(file: File): void {
    this.uploading.set(true);
    this.errorMsg.set(null);

    this.storageService.upload(file, 'avatar', true).subscribe({
      next: (res: any) => {
        const responseData: any = res.data || res;
        const fileId = responseData.id || responseData.fileId;
        let uploadedUrl = responseData.publicUrl || responseData.url;
        if (!uploadedUrl || !uploadedUrl.startsWith('http')) {
          if (fileId) {
            uploadedUrl = `${environment.apiUrl}/storage/files/${fileId}/download`;
          }
        }

        if (!uploadedUrl) {
          this.errorMsg.set('No se obtuvo la URL de la imagen subida.');
          this.uploading.set(false);
          return;
        }

        // Actualizar foto de perfil en user-service y refrescar AuthStore
        this.userProfileService.uploadAvatar(uploadedUrl).subscribe({
          next: () => {
            this.authStore.loadUserProfile();
            this.avatarChanged.emit(uploadedUrl);
            this.uploading.set(false);
          },
          error: (err: any) => {
            console.error('Error al actualizar avatar en perfil:', err);
            this.errorMsg.set('Error al asociar la foto a tu perfil.');
            this.uploading.set(false);
          },
        });
      },
      error: (err: any) => {
        console.error('Error al subir archivo a Storage:', err);
        this.errorMsg.set('Error al subir la imagen. Inténtalo de nuevo.');
        this.uploading.set(false);
      },
    });
  }

  removeAvatar(): void {
    this.uploading.set(true);
    this.errorMsg.set(null);

    this.userProfileService.deleteAvatar().subscribe({
      next: () => {
        this.authStore.loadUserProfile();
        this.avatarChanged.emit(null);
        this.uploading.set(false);
      },
      error: (err: any) => {
        console.error('Error al eliminar avatar:', err);
        this.errorMsg.set('Error al eliminar la foto de perfil.');
        this.uploading.set(false);
      },
    });
  }
}
