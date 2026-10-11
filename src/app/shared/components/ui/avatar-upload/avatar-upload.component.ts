import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  effect,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { StorageService } from '../../../../core/services/storage.service';
import { UserProfileService } from '../../../../core/services/user-profile.service';
import { CompanyProfileService } from '../../../../core/services/company-profile.service';
import { AuthStore } from '../../../../state/auth.store';
import { resolveImageUrl } from '../../../utils/image.utils';
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
  readonly shape = input<'circle' | 'rounded'>('circle');
  readonly mode = input<'user' | 'company'>('user');
  readonly label = input<string>('Foto');
  readonly category = input<string>('avatar');
  readonly companyName = input<string | null>(null);
  readonly fallbackIcon = input<string>('person');
  readonly avatarChanged = output<string | null>();

  readonly dialog = inject(MatDialog);
  readonly storageService = inject(StorageService);
  readonly userProfileService = inject(UserProfileService);
  readonly companyProfileService = inject(CompanyProfileService);
  readonly authStore = inject(AuthStore);

  readonly uploading = signal<boolean>(false);
  readonly errorMsg = signal<string | null>(null);
  readonly imgLoadError = signal<boolean>(false);

  readonly resolvedAvatarUrl = computed(() => {
    return resolveImageUrl(this.currentAvatarUrl());
  });

  constructor() {
    // Reset imgLoadError whenever the input URL changes
    effect(() => {
      this.currentAvatarUrl();
      this.imgLoadError.set(false);
      this.errorMsg.set(null);
    });
  }

  onImgError(): void {
    this.imgLoadError.set(true);
  }

  onImgLoad(): void {
    this.imgLoadError.set(false);
  }

  get initials(): string {
    if (this.mode() === 'company' || this.companyName()) {
      const name = (this.companyName() || this.authStore.displayName() || '').trim();
      if (!name) return 'EMP';
      const parts = name.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }

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
    const isCompany = this.mode() === 'company';
    const dialogRef = this.dialog.open(AvatarCropDialogComponent, {
      data: {
        imageFile: file,
        cropShape: this.shape() === 'rounded' || isCompany ? 'square' : 'circle',
        title: isCompany ? 'Recortar Logo de la Empresa' : 'Recortar Foto de Perfil',
      },
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
    this.imgLoadError.set(false);

    const uploadCategory = this.mode() === 'company' ? 'company_logo' : this.category();

    this.storageService.upload(file, uploadCategory, true).subscribe({
      next: (res: any) => {
        const responseData: any = res.data || res;
        const uploadedUrl = resolveImageUrl(responseData.url || responseData.publicUrl);

        if (!uploadedUrl) {
          this.errorMsg.set('No se obtuvo la URL de la imagen subida.');
          this.uploading.set(false);
          return;
        }

        if (this.mode() === 'company') {
          // Actualizar logo en company-service y avatar en user-service
          this.companyProfileService.updateProfile({ logoUrl: uploadedUrl }).subscribe({
            next: () => {
              this.userProfileService.uploadAvatar(uploadedUrl).subscribe({
                next: () => {
                  this.authStore.loadUserProfile();
                  this.avatarChanged.emit(uploadedUrl);
                  this.uploading.set(false);
                },
                error: () => {
                  this.authStore.loadUserProfile();
                  this.avatarChanged.emit(uploadedUrl);
                  this.uploading.set(false);
                },
              });
            },
            error: (err: any) => {
              console.error('Error al actualizar logo de empresa:', err);
              this.errorMsg.set('Error al actualizar el logo en tu perfil de empresa.');
              this.uploading.set(false);
            },
          });
        } else {
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
        }
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

    if (this.mode() === 'company') {
      this.companyProfileService.updateProfile({ logoUrl: undefined }).subscribe({
        next: () => {
          this.userProfileService.deleteAvatar().subscribe({
            next: () => {
              this.authStore.loadUserProfile();
              this.avatarChanged.emit(null);
              this.uploading.set(false);
            },
            error: () => {
              this.authStore.loadUserProfile();
              this.avatarChanged.emit(null);
              this.uploading.set(false);
            },
          });
        },
        error: (err: any) => {
          console.error('Error al eliminar logo:', err);
          this.errorMsg.set('Error al eliminar el logo de la empresa.');
          this.uploading.set(false);
        },
      });
    } else {
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
}
