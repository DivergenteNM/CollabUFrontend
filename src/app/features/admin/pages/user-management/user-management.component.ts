import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { httpResource, HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { PaginatedResponse } from '../../../../core/models';
import { DepartmentCatalogService } from '../../../../core/services/department-catalog.service';

export interface UserRow {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  lastLogin: string | null;
  createdAt: string;
  /** Solo admin: 'super' (Facultad) o 'department'. */
  adminLevel?: 'super' | 'department' | null;
  departmentId?: string | null;
}

// ─── Create User Dialog ───────────────────────────────────────────────────────
@Component({
  selector: 'app-user-create-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatIconModule, FormsModule],
  template: `
    <h2 mat-dialog-title class="dlg-title">
      <mat-icon>person_add</mat-icon> Crear usuario
    </h2>
    <mat-dialog-content class="dlg-content">
      <p class="dlg-hint">El usuario se crea verificado y activo. Completará su perfil en el onboarding.</p>

      <mat-form-field appearance="outline" class="full-w">
        <mat-label>Correo electrónico</mat-label>
        <input matInput type="email" [(ngModel)]="email" placeholder="usuario@ejemplo.com" />
        <mat-icon matPrefix>email</mat-icon>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-w">
        <mat-label>Contraseña</mat-label>
        <input matInput [type]="showPwd() ? 'text' : 'password'" [(ngModel)]="password" />
        <mat-icon matPrefix>lock</mat-icon>
        <button mat-icon-button matSuffix type="button" (click)="showPwd.set(!showPwd())">
          <mat-icon>{{ showPwd() ? 'visibility_off' : 'visibility' }}</mat-icon>
        </button>
        <mat-hint>Mínimo 8 caracteres</mat-hint>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-w">
        <mat-label>Confirmar contraseña</mat-label>
        <input matInput [type]="showPwd() ? 'text' : 'password'" [(ngModel)]="confirmPassword" />
        <mat-icon matPrefix>lock_reset</mat-icon>
        @if (confirmPassword && password !== confirmPassword) {
          <mat-error>Las contraseñas no coinciden</mat-error>
        }
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-w">
        <mat-label>Rol</mat-label>
        <mat-select [(ngModel)]="role">
          <mat-option value="student">Estudiante</mat-option>
          <mat-option value="company">Empresa</mat-option>
          <mat-option value="faculty">Docente / Supervisor</mat-option>
          <mat-option value="admin">Administrador</mat-option>
        </mat-select>
        <mat-icon matPrefix>badge</mat-icon>
      </mat-form-field>

      @if (role === 'admin') {
        <mat-form-field appearance="outline" class="full-w">
          <mat-label>Nivel de administración</mat-label>
          <mat-select [(ngModel)]="adminLevel" data-testid="admin-level">
            <mat-option value="super">Facultad (ve todos los departamentos)</mat-option>
            <mat-option value="department">Departamento (solo el suyo)</mat-option>
          </mat-select>
          <mat-icon matPrefix>admin_panel_settings</mat-icon>
        </mat-form-field>

        @if (adminLevel === 'department') {
          <mat-form-field appearance="outline" class="full-w">
            <mat-label>Departamento</mat-label>
            <mat-select [(ngModel)]="departmentId" data-testid="admin-department">
              @for (d of departments.departments(); track d.id) {
                <mat-option [value]="d.id">{{ d.name }}</mat-option>
              }
            </mat-select>
            <mat-icon matPrefix>apartment</mat-icon>
          </mat-form-field>
        }
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Cancelar</button>
      <button mat-flat-button color="primary" [disabled]="!canSave()" (click)="save()">
        <mat-icon>person_add</mat-icon> Crear usuario
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dlg-title  { display: flex; align-items: center; gap: 8px; }
    .dlg-content { display: flex; flex-direction: column; gap: 4px; min-width: 400px; padding-top: 8px; }
    .dlg-hint   { font-size: 0.8rem; color: #757575; background: #f5f5f5; padding: 8px 12px;
                  border-radius: 8px; margin: 0 0 8px; }
    .full-w     { width: 100%; }
  `],
})
export class UserCreateDialogComponent {
  readonly dialogRef = inject(MatDialogRef<UserCreateDialogComponent>);
  email = '';
  password = '';
  confirmPassword = '';
  role = 'student';
  adminLevel: 'super' | 'department' = 'department';
  departmentId = '';
  readonly showPwd = signal(false);
  readonly departments = inject(DepartmentCatalogService);

  constructor() {
    void this.departments.load();
  }

  canSave(): boolean {
    const base = !!this.email && this.password.length >= 8 && this.password === this.confirmPassword && !!this.role;
    if (!base) return false;
    // Un admin de departamento exige departamento.
    return this.role !== 'admin' || this.adminLevel === 'super' || !!this.departmentId;
  }
  save(): void {
    if (!this.canSave()) return;
    const payload: Record<string, unknown> = { email: this.email, password: this.password, role: this.role };
    if (this.role === 'admin') {
      payload['adminLevel'] = this.adminLevel;
      if (this.adminLevel === 'department') payload['departmentId'] = this.departmentId;
    }
    this.dialogRef.close(payload);
  }
}

// ─── Edit Dialog ──────────────────────────────────────────────────────────────
@Component({
  selector: 'app-user-edit-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatSlideToggleModule, MatIconModule, FormsModule],
  template: `
    <h2 mat-dialog-title class="dlg-title">
      <mat-icon>manage_accounts</mat-icon> Editar usuario
    </h2>
    <mat-dialog-content class="dlg-content">

      <!-- Sección: Credenciales -->
      <div class="section-label">Credenciales</div>

      <mat-form-field appearance="outline" class="full-w">
        <mat-label>Correo electrónico</mat-label>
        <input matInput type="email" [(ngModel)]="editEmail" />
        <mat-icon matPrefix>email</mat-icon>
        <mat-hint>Deja igual si no deseas cambiarlo</mat-hint>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-w">
        <mat-label>Nueva contraseña</mat-label>
        <input matInput [type]="showPwd() ? 'text' : 'password'" [(ngModel)]="newPassword"
          placeholder="Dejar vacío para no cambiar" />
        <mat-icon matPrefix>lock</mat-icon>
        <button mat-icon-button matSuffix type="button" (click)="showPwd.set(!showPwd())">
          <mat-icon>{{ showPwd() ? 'visibility_off' : 'visibility' }}</mat-icon>
        </button>
        <mat-hint>Mínimo 8 caracteres · Vacío = sin cambio</mat-hint>
      </mat-form-field>

      <!-- Sección: Rol y estado -->
      <div class="section-label" style="margin-top:8px">Rol y estado</div>

      <mat-form-field appearance="outline" class="full-w">
        <mat-label>Rol</mat-label>
        <mat-select [(ngModel)]="editRole">
          <mat-option value="student">Estudiante</mat-option>
          <mat-option value="company">Empresa</mat-option>
          <mat-option value="faculty">Docente / Supervisor</mat-option>
          <mat-option value="admin">Administrador</mat-option>
        </mat-select>
        <mat-icon matPrefix>badge</mat-icon>
      </mat-form-field>

      @if (editRole === 'admin') {
        <mat-form-field appearance="outline" class="full-w">
          <mat-label>Nivel de administración</mat-label>
          <mat-select [(ngModel)]="editLevel">
            <mat-option value="super">Facultad (ve todos los departamentos)</mat-option>
            <mat-option value="department">Departamento (solo el suyo)</mat-option>
          </mat-select>
          <mat-icon matPrefix>admin_panel_settings</mat-icon>
        </mat-form-field>

        @if (editLevel === 'department') {
          <mat-form-field appearance="outline" class="full-w">
            <mat-label>Departamento</mat-label>
            <mat-select [(ngModel)]="editDepartmentId">
              @for (d of departments.departments(); track d.id) {
                <mat-option [value]="d.id">{{ d.name }}</mat-option>
              }
            </mat-select>
            <mat-icon matPrefix>apartment</mat-icon>
          </mat-form-field>
        }
      }

      <div class="toggle-row">
        <div>
          <div class="toggle-label">Estado de la cuenta</div>
          <div class="toggle-hint">{{ editActive ? 'El usuario puede acceder a la plataforma' : 'Acceso bloqueado' }}</div>
        </div>
        <mat-slide-toggle [(ngModel)]="editActive" />
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Cancelar</button>
      <button mat-flat-button color="primary" [disabled]="!canSave()" (click)="save()">
        <mat-icon>save</mat-icon> Guardar cambios
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dlg-title     { display: flex; align-items: center; gap: 8px; }
    .dlg-content   { display: flex; flex-direction: column; gap: 4px; min-width: 400px; padding-top: 8px; }
    .section-label { font-size: 0.75rem; font-weight: 600; color: var(--color-primary-400); text-transform: uppercase;
                     letter-spacing: 0.08em; padding: 4px 0 2px; border-bottom: 1px solid var(--border-subtle); margin-bottom: 4px; }
    .full-w        { width: 100%; }
    .toggle-row    { display: flex; justify-content: space-between; align-items: center;
                     padding: 12px 0; border-top: 1px solid var(--border-subtle); margin-top: 4px; }
    .toggle-label  { font-size: 0.9rem; font-weight: 500; color: var(--text-primary); }
    .toggle-hint   { font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px; }
  `],
})
export class UserEditDialogComponent {
  readonly data = inject<UserRow>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<UserEditDialogComponent>);
  editEmail = this.data.email;
  editRole = this.data.role;
  editActive = this.data.isActive;
  editLevel: 'super' | 'department' = this.data.adminLevel ?? 'super';
  editDepartmentId = this.data.departmentId ?? '';
  newPassword = '';
  readonly showPwd = signal(false);
  readonly departments = inject(DepartmentCatalogService);

  constructor() {
    void this.departments.load();
  }

  canSave(): boolean {
    if (!this.editEmail) return false;
    if (this.newPassword && this.newPassword.length < 8) return false;
    if (this.editRole === 'admin' && this.editLevel === 'department' && !this.editDepartmentId) return false;
    return true;
  }

  save(): void {
    const result: Record<string, unknown> = {
      role: this.editRole,
      isActive: this.editActive,
    };
    if (this.editRole === 'admin') {
      result['adminLevel'] = this.editLevel;
      result['departmentId'] = this.editLevel === 'department' ? this.editDepartmentId : null;
    }
    if (this.editEmail !== this.data.email) result['email'] = this.editEmail;
    if (this.newPassword) result['password'] = this.newPassword;
    this.dialogRef.close(result);
  }
}

// ─── Delete Confirm Dialog ────────────────────────────────────────────────────
@Component({
  selector: 'app-confirm-delete-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title class="del-title">
      <mat-icon color="warn">warning</mat-icon> Confirmar eliminación
    </h2>
    <mat-dialog-content>
      <p>¿Eliminar al usuario <strong>{{ data.email }}</strong>?</p>
      <p class="del-warn">Esta acción es permanente y no se puede deshacer.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close(false)">Cancelar</button>
      <button mat-flat-button color="warn" (click)="dialogRef.close(true)">
        <mat-icon>delete</mat-icon> Eliminar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .del-title { display: flex; align-items: center; gap: 8px; }
    .del-warn  { color: #c62828; font-size: 0.85rem; margin-top: 4px; }
  `],
})
export class ConfirmDeleteDialogComponent {
  readonly data = inject<{ email: string }>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<ConfirmDeleteDialogComponent>);
}

// ─── Main Component ───────────────────────────────────────────────────────────
@Component({
  selector: 'app-user-management',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatTableModule, MatPaginatorModule,
    MatTooltipModule, MatProgressBarModule,
    MatChipsModule,
    FormsModule, DatePipe,
  ],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.scss',
})
export class UserManagementComponent {
  private readonly http = inject(HttpClient);
  private readonly dialog = inject(MatDialog);

  readonly search = signal('');
  readonly roleFilter = signal('');
  readonly statusFilter = signal('');
  readonly page = signal(1);

  readonly displayedColumns = ['email', 'role', 'status', 'verified', 'lastLogin', 'createdAt', 'actions'];

  readonly resource = httpResource<PaginatedResponse<UserRow>>(
    () => ({
      url: `${environment.apiUrl}/auth/admin/users`,
      params: {
        page: this.page().toString(),
        limit: '10',
        ...(this.search() ? { search: this.search() } : {}),
        ...(this.roleFilter() ? { role: this.roleFilter() } : {}),
        ...(this.statusFilter() ? { isActive: this.statusFilter() } : {}),
      },
    })
  );

  readonly users = computed(() => this.resource.value()?.data ?? []);
  // total: never resets to 0 during loading so the paginator is not destroyed
  private _lastTotal = 0;
  readonly total = computed(() => {
    const t = this.resource.value()?.meta?.total;
    if (t !== undefined) this._lastTotal = t;
    return this._lastTotal;
  });

  readonly roleLabels: Record<string, string> = {
    student: 'Estudiante',
    company: 'Empresa',
    faculty: 'Docente',
    admin: 'Administrador',
  };

  readonly departments = inject(DepartmentCatalogService);

  constructor() {
    void this.departments.load();
  }

  getRoleLabel(role: string): string { return this.roleLabels[role] ?? role; }

  /** "Facultad" o "Depto. Sistemas" para administradores; vacío para el resto. */
  adminScopeLabel(user: UserRow): string {
    if (user.role !== 'admin') return '';
    if (user.adminLevel === 'department') {
      const name = this.departments.shortName(user.departmentId);
      return name ? `Depto. ${name}` : 'Departamento';
    }
    return 'Facultad';
  }

  onPage(event: PageEvent): void { this.page.set(event.pageIndex + 1); }

  createUser(): void {
    this.dialog.open(UserCreateDialogComponent, { width: '460px' })
      .afterClosed()
      .subscribe(result => {
        if (result) {
          this.http.post(`${environment.apiUrl}/auth/admin/users`, result)
            .subscribe(() => { this.page.set(1); this.resource.reload(); });
        }
      });
  }

  editUser(user: UserRow): void {
    this.dialog.open(UserEditDialogComponent, { data: user, width: '460px' })
      .afterClosed()
      .subscribe(result => {
        if (result) {
          this.http.patch(`${environment.apiUrl}/auth/admin/users/${user.id}`, result)
            .subscribe(() => this.resource.reload());
        }
      });
  }

  deleteUser(user: UserRow): void {
    this.dialog.open(ConfirmDeleteDialogComponent, { data: { email: user.email }, width: '380px' })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          this.http.delete(`${environment.apiUrl}/auth/admin/users/${user.id}`)
            .subscribe(() => this.resource.reload());
        }
      });
  }
}


