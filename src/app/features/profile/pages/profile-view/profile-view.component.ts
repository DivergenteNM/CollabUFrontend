import { Component, ChangeDetectionStrategy, inject, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CompanyProfile, StudentProfile } from '../../../../core/models';
import { CompanyProfileService } from '../../../../core/services/company-profile.service';
import { StudentService } from '../../../students/services/student.service';
import { AuthStore } from '../../../../state/auth.store';
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
  private readonly studentService = inject(StudentService);
  private readonly companyProfileService = inject(CompanyProfileService);

  readonly loading = signal(true);
  readonly student = signal<StudentProfile | null>(null);
  readonly company = signal<CompanyProfile | null>(null);

  constructor() {
    this.loadProfile();
  }

  readonly skillNames = computed(() =>
    this.student()?.skills?.map((s) => s.name) ?? []
  );

  readonly practiceProgress = computed(() => {
    const profile = this.student();
    const completed = profile?.practiceHoursCompleted ?? 0;
    const required = profile?.practiceHoursRequired ?? 0;
    if (required <= 0) return 0;
    return Math.min(100, Math.round((completed / required) * 100));
  });

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

  private loadProfile(): void {
    this.loading.set(true);

    if (this.authStore.isStudent()) {
      this.studentService.getProfile().subscribe({
        next: (res) => {
          this.student.set({
            ...res.data,
            education: res.data.education ?? res.data.academicInfo ?? [],
            experiences: res.data.experiences ?? res.data.workExperience ?? [],
          });
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
      return;
    }

    if (this.authStore.isCompany()) {
      this.companyProfileService.getProfile().subscribe({
        next: (res) => {
          this.company.set(res.data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
      return;
    }

    this.loading.set(false);
  }
}
