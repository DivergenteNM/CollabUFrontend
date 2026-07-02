import {
  Component, ChangeDetectionStrategy, signal, computed, inject,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { httpResource, HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

// ─── Interfaces ───────────────────────────────────────────────────────────────
export interface CompanyRow {
  id: string;
  userId: string;
  companyName: string;
  legalName: string;
  nit: string;
  industry: string;
  companySize: string;
  description: string;
  website: string;
  verificationStatus: string;
  profileCompleteness: number;
  employeeCount?: number;
  foundedYear?: number;
  headquartersCity?: string;
  headquartersState?: string;
  createdAt: string;
  contacts?: { firstName: string; lastName: string; position: string; email: string; phone: string; isPrimary: boolean }[];
  businessAreas?: { areaName: string }[];
}

export interface ProjectRow {
  id: string;
  companyId: string;
  title: string;
  description: string;
  projectType: string;
  status: string;
  locationType: string;
  compensationType: string;
  positionsAvailable: number;
  startDate: string;
  endDate: string;
  applicationDeadline?: string;
  createdAt: string;
  weeklyHours?: number;
  totalHours?: number;
  minimumSemester?: number;
  academicPrograms?: string[];
  tags?: string[];
  requirements?: { name: string; requirementType: string; proficiencyLevel: string; isMandatory: boolean }[];
}

interface PaginatedMeta { page: number; limit: number; total: number; totalPages: number; }
interface Paginated<T>  { data: T[]; meta: PaginatedMeta; }

// ─── Company Detail Dialog ────────────────────────────────────────────────────
@Component({
  selector: 'app-company-detail-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, MatDividerModule, DatePipe],
  template: `
    <div class="det-header">
      <div class="det-avatar">{{ c.companyName[0] }}</div>
      <div class="det-title-block">
        <h2 mat-dialog-title class="det-title">{{ c.companyName }}</h2>
        <p class="det-legal">{{ c.legalName }}</p>
        <span class="det-status det-status--{{ c.verificationStatus }}">{{ verifLabel(c.verificationStatus) }}</span>
      </div>
      <button mat-icon-button (click)="dialogRef.close()" class="det-close"><mat-icon>close</mat-icon></button>
    </div>

    <mat-dialog-content class="det-content">

      <section class="det-section">
        <h3 class="det-section-title"><mat-icon>info</mat-icon> Información general</h3>
        <div class="det-grid">
          <div class="det-field"><span class="det-label">NIT</span><span class="det-value mono">{{ c.nit || '—' }}</span></div>
          <div class="det-field"><span class="det-label">Industria</span><span class="det-value">{{ c.industry || '—' }}</span></div>
          <div class="det-field"><span class="det-label">Tamaño</span><span class="det-value">{{ sizeLabel(c.companySize) }}</span></div>
          <div class="det-field"><span class="det-label">Empleados</span><span class="det-value">{{ c.employeeCount ?? '—' }}</span></div>
          <div class="det-field"><span class="det-label">Fundada en</span><span class="det-value">{{ c.foundedYear ?? '—' }}</span></div>
          <div class="det-field"><span class="det-label">Sede</span><span class="det-value">{{ c.headquartersCity }}{{ c.headquartersState ? ', ' + c.headquartersState : '' }}</span></div>
          <div class="det-field"><span class="det-label">Sitio web</span>
            @if (c.website) { <a [href]="c.website" target="_blank" class="det-link">{{ c.website }}</a> }
            @else { <span class="det-value">—</span> }
          </div>
          <div class="det-field"><span class="det-label">Registrada</span><span class="det-value">{{ c.createdAt | date:'d MMM y, HH:mm' }}</span></div>
          <div class="det-field"><span class="det-label">Perfil</span><span class="det-value">{{ c.profileCompleteness }}% completo</span></div>
        </div>
      </section>

      @if (c.description) {
        <mat-divider />
        <section class="det-section">
          <h3 class="det-section-title"><mat-icon>description</mat-icon> Descripción</h3>
          <p class="det-description">{{ c.description }}</p>
        </section>
      }

      @if (c.contacts?.length) {
        <mat-divider />
        <section class="det-section">
          <h3 class="det-section-title"><mat-icon>contacts</mat-icon> Contactos</h3>
          @for (contact of c.contacts; track contact.email) {
            <div class="det-contact" [class.det-contact--primary]="contact.isPrimary">
              <div class="det-contact-name">
                {{ contact.firstName }} {{ contact.lastName }}
                @if (contact.isPrimary) { <span class="primary-badge">Principal</span> }
              </div>
              <div class="det-contact-info">
                <span><mat-icon class="micro-icon">work</mat-icon>{{ contact.position || '—' }}</span>
                <span><mat-icon class="micro-icon">email</mat-icon>{{ contact.email || '—' }}</span>
                <span><mat-icon class="micro-icon">phone</mat-icon>{{ contact.phone || '—' }}</span>
              </div>
            </div>
          }
        </section>
      }

      @if (c.businessAreas?.length) {
        <mat-divider />
        <section class="det-section">
          <h3 class="det-section-title"><mat-icon>category</mat-icon> Áreas de negocio</h3>
          <div class="det-tags">
            @for (area of c.businessAreas; track area.areaName) {
              <span class="det-tag">{{ area.areaName }}</span>
            }
          </div>
        </section>
      }

    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Cerrar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .det-header { display:flex; align-items:flex-start; gap:14px; padding:20px 24px 0; position:relative; }
    .det-avatar { width:52px; height:52px; border-radius:12px; background:linear-gradient(135deg,#3b82f6,#6366f1);
      color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:1.4rem; flex-shrink:0; }
    .det-title-block { flex:1; }
    .det-title { margin:0; font-size:1.2rem; font-weight:700; }
    .det-legal { margin:2px 0 6px; font-size:.8125rem; color:#6b7280; }
    .det-status { display:inline-block; padding:2px 10px; border-radius:12px; font-size:.7rem; font-weight:600; }
    .det-status--pending   { background:#fef3c7; color:#92400e; }
    .det-status--verified  { background:#d1fae5; color:#065f46; }
    .det-status--rejected  { background:#fee2e2; color:#991b1b; }
    .det-status--suspended { background:#ffedd5; color:#9a3412; }
    .det-close { position:absolute; top:12px; right:12px; }
    .det-content { min-width:520px; max-width:640px; padding:12px 24px; }
    .det-section { padding:12px 0; }
    .det-section-title { display:flex; align-items:center; gap:6px; font-size:.875rem; font-weight:600;
      color:#374151; margin:0 0 12px; mat-icon { font-size:17px; height:17px; width:17px; } }
    .det-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px 24px; }
    .det-field { display:flex; flex-direction:column; gap:2px; }
    .det-label { font-size:.7rem; text-transform:uppercase; letter-spacing:.04em; color:#9ca3af; font-weight:600; }
    .det-value { font-size:.875rem; color:#111827; }
    .det-value.mono { font-family:monospace; }
    .det-link { font-size:.875rem; color:#3b82f6; text-decoration:none; word-break:break-all; }
    .det-description { font-size:.875rem; color:#374151; line-height:1.6; margin:0; white-space:pre-wrap; }
    .det-contact { border:1px solid #e5e7eb; border-radius:8px; padding:10px 12px; margin-bottom:8px; }
    .det-contact--primary { border-color:#3b82f6; background:#eff6ff; }
    .det-contact-name { font-weight:600; font-size:.875rem; display:flex; align-items:center; gap:8px; margin-bottom:6px; }
    .primary-badge { background:#3b82f6; color:#fff; font-size:.65rem; padding:1px 7px; border-radius:10px; }
    .det-contact-info { display:flex; flex-wrap:wrap; gap:12px; font-size:.8rem; color:#4b5563; }
    .det-contact-info span { display:flex; align-items:center; gap:4px; }
    .micro-icon { font-size:14px; height:14px; width:14px; }
    .det-tags { display:flex; flex-wrap:wrap; gap:6px; }
    .det-tag { background:#ede9fe; color:#5b21b6; font-size:.75rem; padding:3px 10px; border-radius:10px; }
  `],
})
export class CompanyDetailDialogComponent {
  readonly c         = inject<CompanyRow>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<CompanyDetailDialogComponent>);

  verifLabel(s: string) {
    return ({ pending:'Pendiente', verified:'Verificada', rejected:'Rechazada', suspended:'Suspendida' } as Record<string,string>)[s] ?? s;
  }
  sizeLabel(s: string) {
    return ({ micro:'Micro', small:'Pequeña', medium:'Mediana', large:'Grande', enterprise:'Corporación' } as Record<string,string>)[s] ?? s;
  }
}

// ─── Project Detail Dialog ────────────────────────────────────────────────────
@Component({
  selector: 'app-project-detail-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, MatDividerModule, DatePipe],
  template: `
    <div class="det-header">
      <div class="det-avatar det-avatar--project"><mat-icon>work</mat-icon></div>
      <div class="det-title-block">
        <h2 mat-dialog-title class="det-title">{{ p.title }}</h2>
        <div class="det-tags-inline">
          <span class="det-type-badge">{{ projTypeLabel(p.projectType) }}</span>
        </div>
      </div>
      <button mat-icon-button (click)="dialogRef.close()" class="det-close"><mat-icon>close</mat-icon></button>
    </div>

    <mat-dialog-content class="det-content">

      <section class="det-section">
        <h3 class="det-section-title"><mat-icon>info</mat-icon> Detalles del proyecto</h3>
        <div class="det-grid">
          <div class="det-field"><span class="det-label">Modalidad</span><span class="det-value">{{ locationLabel(p.locationType) }}</span></div>
          <div class="det-field"><span class="det-label">Compensación</span><span class="det-value">{{ compensationLabel(p.compensationType) }}</span></div>
          <div class="det-field"><span class="det-label">Vacantes</span><span class="det-value">{{ p.positionsAvailable }}</span></div>
          <div class="det-field"><span class="det-label">Semestre mínimo</span><span class="det-value">{{ p.minimumSemester ?? '—' }}</span></div>
          <div class="det-field"><span class="det-label">Horas semanales</span><span class="det-value">{{ p.weeklyHours ? p.weeklyHours + ' h/sem' : '—' }}</span></div>
          <div class="det-field"><span class="det-label">Horas totales</span><span class="det-value">{{ p.totalHours ? p.totalHours + ' h' : '—' }}</span></div>
          <div class="det-field"><span class="det-label">Inicio</span><span class="det-value">{{ p.startDate ? (p.startDate | date:'d MMM y') : '—' }}</span></div>
          <div class="det-field"><span class="det-label">Fin</span><span class="det-value">{{ p.endDate ? (p.endDate | date:'d MMM y') : '—' }}</span></div>
          <div class="det-field"><span class="det-label">Cierre apps</span><span class="det-value">{{ p.applicationDeadline ? (p.applicationDeadline | date:'d MMM y') : '—' }}</span></div>
          <div class="det-field"><span class="det-label">Enviado</span><span class="det-value">{{ p.createdAt | date:'d MMM y, HH:mm' }}</span></div>
        </div>
      </section>

      @if (p.description) {
        <mat-divider />
        <section class="det-section">
          <h3 class="det-section-title"><mat-icon>description</mat-icon> Descripción</h3>
          <p class="det-description">{{ p.description }}</p>
        </section>
      }

      @if (p.requirements?.length) {
        <mat-divider />
        <section class="det-section">
          <h3 class="det-section-title"><mat-icon>checklist</mat-icon> Requisitos</h3>
          @for (req of p.requirements; track req.name) {
            <div class="det-req" [class.det-req--mandatory]="req.isMandatory">
              <span class="det-req-name">{{ req.name }}</span>
              <span class="det-req-type">{{ req.requirementType }}</span>
              @if (req.proficiencyLevel) { <span class="det-req-level">{{ req.proficiencyLevel }}</span> }
              <span class="det-req-flag" [class.det-req-flag--req]="req.isMandatory">
                {{ req.isMandatory ? 'Obligatorio' : 'Opcional' }}
              </span>
            </div>
          }
        </section>
      }

      @if (p.tags?.length) {
        <mat-divider />
        <section class="det-section">
          <h3 class="det-section-title"><mat-icon>label</mat-icon> Etiquetas</h3>
          <div class="det-tags">
            @for (tag of p.tags; track tag) {
              <span class="det-tag">{{ tag }}</span>
            }
          </div>
        </section>
      }

      @if (p.academicPrograms?.length) {
        <mat-divider />
        <section class="det-section">
          <h3 class="det-section-title"><mat-icon>school</mat-icon> Programas académicos</h3>
          <div class="det-tags">
            @for (prog of p.academicPrograms; track prog) {
              <span class="det-tag det-tag--prog">{{ prog }}</span>
            }
          </div>
        </section>
      }

    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Cerrar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .det-header { display:flex; align-items:flex-start; gap:14px; padding:20px 24px 0; position:relative; }
    .det-avatar { width:52px; height:52px; border-radius:12px; background:linear-gradient(135deg,#10b981,#059669);
      color:#fff; display:flex; align-items:center; justify-content:center; flex-shrink:0;
      mat-icon { font-size:26px; } }
    .det-title-block { flex:1; }
    .det-title { margin:0 0 6px; font-size:1.2rem; font-weight:700; }
    .det-tags-inline { display:flex; gap:6px; flex-wrap:wrap; }
    .det-type-badge { background:#ede9fe; color:#5b21b6; font-size:.75rem; padding:2px 9px; border-radius:10px; font-weight:500; }
    .det-close { position:absolute; top:12px; right:12px; }
    .det-content { min-width:520px; max-width:640px; padding:12px 24px; }
    .det-section { padding:12px 0; }
    .det-section-title { display:flex; align-items:center; gap:6px; font-size:.875rem; font-weight:600;
      color:#374151; margin:0 0 12px; mat-icon { font-size:17px; height:17px; width:17px; } }
    .det-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px 24px; }
    .det-field { display:flex; flex-direction:column; gap:2px; }
    .det-label { font-size:.7rem; text-transform:uppercase; letter-spacing:.04em; color:#9ca3af; font-weight:600; }
    .det-value { font-size:.875rem; color:#111827; }
    .det-description { font-size:.875rem; color:#374151; line-height:1.6; margin:0; white-space:pre-wrap; }
    .det-req { display:flex; align-items:center; gap:8px; padding:7px 10px; border-radius:6px;
      background:#f9fafb; margin-bottom:6px; flex-wrap:wrap; }
    .det-req--mandatory { background:#fff7ed; }
    .det-req-name { font-weight:600; font-size:.8125rem; }
    .det-req-type { font-size:.75rem; color:#6b7280; background:#f3f4f6; padding:1px 7px; border-radius:8px; }
    .det-req-level { font-size:.75rem; color:#0277bd; background:#e1f5fe; padding:1px 7px; border-radius:8px; }
    .det-req-flag { font-size:.7rem; margin-left:auto; }
    .det-req-flag--req { color:#b45309; font-weight:600; }
    .det-tags { display:flex; flex-wrap:wrap; gap:6px; }
    .det-tag { background:#ede9fe; color:#5b21b6; font-size:.75rem; padding:3px 10px; border-radius:10px; }
    .det-tag--prog { background:#e0f2fe; color:#0369a1; }
  `],
})
export class ProjectDetailDialogComponent {
  readonly p         = inject<ProjectRow>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<ProjectDetailDialogComponent>);

  projTypeLabel(s: string) {
    return ({ internship:'Práctica', professional_practice:'Práctica Profesional', thesis:'Tesis',
      research:'Investigación', other:'Otro' } as Record<string,string>)[s] ?? s;
  }
  locationLabel(s: string) {
    return ({ remote:'Remoto', onsite:'Presencial', hybrid:'Híbrido' } as Record<string,string>)[s] ?? s;
  }
  compensationLabel(s: string) {
    return ({ paid:'Remunerado', unpaid:'No remunerado', academic_credit:'Créditos académicos', stipend:'Estipendio' } as Record<string,string>)[s] ?? s;
  }
}

// ─── Reject Dialog ────────────────────────────────────────────────────────────
@Component({
  selector: 'app-reject-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, FormsModule],
  template: `
    <h2 mat-dialog-title class="dlg-title"><mat-icon color="warn">cancel</mat-icon> {{ data.title }}</h2>
    <mat-dialog-content class="dlg-content">
      <p class="dlg-sub">{{ data.subtitle }}</p>
      <mat-form-field appearance="outline" class="full-w">
        <mat-label>Motivo del rechazo (opcional)</mat-label>
        <textarea matInput [(ngModel)]="reason" rows="4"
          placeholder="Ej: Documentación incompleta, NIT no válido..."></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close(null)">Cancelar</button>
      <button mat-flat-button color="warn" (click)="dialogRef.close(reason || '')">
        <mat-icon>thumb_down</mat-icon> Rechazar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.dlg-title{display:flex;align-items:center;gap:8px}
    .dlg-content{min-width:380px;padding-top:8px;display:flex;flex-direction:column;gap:8px}
    .dlg-sub{font-size:.875rem;color:#555;margin:0 0 4px}.full-w{width:100%}`],
})
export class RejectDialogComponent {
  readonly data      = inject<{ title: string; subtitle: string }>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<RejectDialogComponent>);
  reason = '';
}

// ─── Suspend Dialog ───────────────────────────────────────────────────────────
@Component({
  selector: 'app-suspend-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, FormsModule],
  template: `
    <h2 mat-dialog-title class="dlg-title"><mat-icon style="color:#e65100">block</mat-icon> Suspender empresa</h2>
    <mat-dialog-content class="dlg-content">
      <p class="dlg-sub">¿Suspender a <strong>{{ data.name }}</strong>?</p>
      <mat-form-field appearance="outline" class="full-w">
        <mat-label>Motivo (opcional)</mat-label>
        <textarea matInput [(ngModel)]="reason" rows="3"></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close(null)">Cancelar</button>
      <button mat-flat-button style="background:#e65100;color:#fff" (click)="dialogRef.close(reason || '')">
        <mat-icon>block</mat-icon> Suspender
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.dlg-title{display:flex;align-items:center;gap:8px}
    .dlg-content{min-width:360px;padding-top:8px;display:flex;flex-direction:column;gap:8px}
    .dlg-sub{font-size:.875rem;margin:0 0 4px}.full-w{width:100%}`],
})
export class SuspendDialogComponent {
  readonly data      = inject<{ name: string }>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<SuspendDialogComponent>);
  reason = '';
}

// ─── Main Component ───────────────────────────────────────────────────────────
@Component({
  selector: 'app-company-verifications',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatTabsModule, MatTableModule, MatPaginatorModule,
    MatTooltipModule, MatProgressBarModule, MatChipsModule,
    MatDividerModule, FormsModule, DatePipe,
  ],
  templateUrl: './company-verifications.component.html',
  styleUrl:    './company-verifications.component.scss',
})
export class CompanyVerificationsComponent {
  private readonly http   = inject(HttpClient);
  private readonly dialog = inject(MatDialog);

  // ── Empresas ──
  readonly companySearch = signal('');
  readonly companyStatus = signal('pending');
  readonly companyPage   = signal(1);

  readonly companyResource = httpResource<Paginated<CompanyRow>>(
    () => ({
      url: `${environment.apiUrl}/companies/admin/list`,
      params: {
        page:   this.companyPage().toString(),
        limit:  '10',
        status: this.companyStatus(),
        ...(this.companySearch() ? { search: this.companySearch() } : {}),
      },
    })
  );

  readonly companies = computed(() => this.companyResource.value()?.data ?? []);
  private _lastCompanyTotal = 0;
  readonly companyTotal = computed(() => {
    const t = this.companyResource.value()?.meta?.total;
    if (t !== undefined) this._lastCompanyTotal = t;
    return this._lastCompanyTotal;
  });

  // ── Proyectos ──
  readonly projectSearch = signal('');
  readonly projectPage   = signal(1);

  readonly projectResource = httpResource<Paginated<ProjectRow>>(
    () => ({
      url: `${environment.apiUrl}/projects/admin/pending`,
      params: {
        page:  this.projectPage().toString(),
        limit: '10',
        ...(this.projectSearch() ? { search: this.projectSearch() } : {}),
      },
    })
  );

  readonly projects = computed(() => this.projectResource.value()?.data ?? []);
  private _lastProjectTotal = 0;
  readonly projectTotal = computed(() => {
    const t = this.projectResource.value()?.meta?.total;
    if (t !== undefined) this._lastProjectTotal = t;
    return this._lastProjectTotal;
  });

  // ── Columnas ──
  readonly companyColumns  = ['company', 'nit', 'industry', 'completeness', 'registered', 'statusCol', 'actions'];
  readonly projectColumns  = ['project', 'type', 'location', 'compensation', 'positions', 'submitted', 'actions'];

  // ── Labels ──
  readonly verifLabels: Record<string, string> = {
    pending: 'Pendiente', verified: 'Verificada', rejected: 'Rechazada', suspended: 'Suspendida',
  };
  readonly projTypeLabels: Record<string, string> = {
    internship: 'Práctica', professional_practice: 'Práctica Prof.', thesis: 'Tesis',
    research: 'Investigación', other: 'Otro',
  };
  readonly locationLabels: Record<string, string> = {
    remote: 'Remoto', onsite: 'Presencial', hybrid: 'Híbrido',
  };
  readonly compensationLabels: Record<string, string> = {
    paid: 'Remunerado', unpaid: 'No remunerado', academic_credit: 'Créditos', stipend: 'Estipendio',
  };

  getVerifLabel(s: string)    { return this.verifLabels[s]       ?? s; }
  getProjType(s: string)      { return this.projTypeLabels[s]    ?? s; }
  getLocation(s: string)      { return this.locationLabels[s]    ?? s; }
  getCompensation(s: string)  { return this.compensationLabels[s] ?? s; }

  getPrimaryContact(c: CompanyRow) {
    return c.contacts?.find(x => x.isPrimary) ?? c.contacts?.[0];
  }

  // ── Detail views ──
  viewCompany(company: CompanyRow) {
    this.dialog.open(CompanyDetailDialogComponent, { data: company, width: '680px', maxHeight: '90vh' });
  }

  viewProject(project: ProjectRow) {
    this.dialog.open(ProjectDetailDialogComponent, { data: project, width: '680px', maxHeight: '90vh' });
  }

  // ── Company actions ──
  onCompanyPage(e: PageEvent) { this.companyPage.set(e.pageIndex + 1); }

  approveCompany(company: CompanyRow) {
    this.http.patch(`${environment.apiUrl}/companies/admin/${company.id}/review`, { action: 'approve' })
      .subscribe(() => this.companyResource.reload());
  }

  rejectCompany(company: CompanyRow) {
    this.dialog.open(RejectDialogComponent, {
      data: { title: 'Rechazar empresa', subtitle: `¿Rechazar la solicitud de ${company.companyName}?` },
      width: '440px',
    }).afterClosed().subscribe(reason => {
      if (reason !== null) {
        this.http.patch(`${environment.apiUrl}/companies/admin/${company.id}/review`, { action: 'reject', reason })
          .subscribe(() => this.companyResource.reload());
      }
    });
  }

  suspendCompany(company: CompanyRow) {
    this.dialog.open(SuspendDialogComponent, { data: { name: company.companyName }, width: '420px' })
      .afterClosed().subscribe(reason => {
        if (reason !== null) {
          this.http.patch(`${environment.apiUrl}/companies/admin/${company.id}/review`, { action: 'suspend', reason })
            .subscribe(() => this.companyResource.reload());
        }
      });
  }

  // ── Project actions ──
  onProjectPage(e: PageEvent) { this.projectPage.set(e.pageIndex + 1); }

  approveProject(project: ProjectRow) {
    this.http.patch(`${environment.apiUrl}/projects/admin/${project.id}/review`, { action: 'approve' })
      .subscribe(() => this.projectResource.reload());
  }

  rejectProject(project: ProjectRow) {
    this.dialog.open(RejectDialogComponent, {
      data: { title: 'Rechazar proyecto', subtitle: `¿Rechazar "${project.title}"?` },
      width: '440px',
    }).afterClosed().subscribe(reason => {
      if (reason !== null) {
        this.http.patch(`${environment.apiUrl}/projects/admin/${project.id}/review`, { action: 'reject', reason })
          .subscribe(() => this.projectResource.reload());
      }
    });
  }
}

