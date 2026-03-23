import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { httpResource } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { ApiResponse, StudentProfile, CompanyProfile } from '../../../../core/models';
import { AuthStore } from '../../../../state/auth.store';
import { UserRole } from '../../../../core/enums/user-role.enum';
import { SkillChipListComponent } from '../../../../shared/components/ui/skill-chip-list/skill-chip-list.component';

@Component({
  selector: 'app-profile-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink, MatIconModule, MatButtonModule, MatCardModule,
    MatChipsModule, MatProgressBarModule, SkillChipListComponent,
  ],
  templateUrl: './profile-view.component.html',
  styleUrl: './profile-view.component.scss',
})
export class ProfileViewComponent {
  readonly authStore = inject(AuthStore);

  readonly studentResource = httpResource<ApiResponse<StudentProfile>>(
    () => this.authStore.isStudent()
      ? { url: `${environment.apiUrl}/students/profile` }
      : undefined
  );

  readonly companyResource = httpResource<ApiResponse<CompanyProfile>>(
    () => this.authStore.isCompany()
      ? { url: `${environment.apiUrl}/companies/profile` }
      : undefined
  );

  readonly skillNames = computed(() =>
    this.studentResource.value()?.data?.skills?.map(s => s.name) ?? []
  );

  docTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      resume: 'CV',
      transcript: 'Certificado Notas',
      certificate: 'Certificado',
      id_document: 'Documento ID',
      other: 'Otro',
    };
    return labels[type] ?? type;
  }
}
