import { Component, OnInit, ChangeDetectionStrategy, inject, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, Users, UserPlus, Pencil, Ban, RotateCcw, X, Check, ShieldCheck } from 'lucide-angular';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { User, CreateUserRequest, UpdateUserRequest } from '../../../core/models/user.model';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
  template: `
    <div class="admin-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Gestión de usuarios</h1>
          <p class="page-subtitle">Crea, edita, suspende y reactiva cuentas de la plataforma</p>
        </div>
        <button class="btn-new" (click)="toggleCreate()">
          <lucide-angular [img]="showCreateForm() ? X : UserPlus" size="18"></lucide-angular>
          {{ showCreateForm() ? 'Cancelar' : 'Crear usuario' }}
        </button>
      </div>

      <nav class="admin-nav">
        <a routerLink="/admin" [routerLinkActiveOptions]="{ exact: true }" routerLinkActive="active">Usuarios</a>
        <a routerLink="/admin/categorias" routerLinkActive="active">Categorías</a>
        <a routerLink="/admin/reglas" routerLinkActive="active">Reglas del motor</a>
      </nav>

      @if (loading()) {
        <div class="table-card">
          <p class="loading-text">Cargando usuarios...</p>
        </div>
      } @else {
        @if (showCreateForm()) {
          <div class="form-card animate-fade-in-down">
            <h3>
              <lucide-angular [img]="UserPlus" size="18"></lucide-angular>
              Crear usuario
            </h3>
            <form (ngSubmit)="createUser()">
              <div class="form-row">
                <div class="form-group">
                  <label>Nombre</label>
                  <input type="text" [(ngModel)]="newUser.nombre" name="nombre" required placeholder="Ej: María López" />
                </div>
                <div class="form-group">
                  <label>Correo electrónico</label>
                  <input type="email" [(ngModel)]="newUser.email" name="email" required placeholder="maria@email.com" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Contraseña</label>
                  <input type="password" [(ngModel)]="newUser.password" name="password" required placeholder="Mínimo 8 caracteres" />
                </div>
                <div class="form-group">
                  <label>Rol</label>
                  <select [(ngModel)]="newUser.role" name="role" required>
                    <option value="user">Usuario</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>
              <button type="submit" class="btn-submit">
                <lucide-angular [img]="Check" size="16"></lucide-angular>
                Crear usuario
              </button>
            </form>
          </div>
        }

        <div class="table-card">
          <div class="table-header">
            <lucide-angular [img]="Users" size="18"></lucide-angular>
            <h3>Usuarios registrados</h3>
            <span class="count">{{ users().length }}</span>
          </div>
          <div class="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (user of users(); track user.id) {
                  <tr>
                    <td class="cell-name">
                      {{ user.nombre }}
                      @if (isSelf(user)) {
                        <span class="self-badge">Tú</span>
                      }
                    </td>
                    <td>{{ user.email }}</td>
                    <td>
                      <span class="badge" [class.admin]="user.role === 'admin'">
                        <lucide-angular [img]="ShieldCheck" size="12"></lucide-angular>
                        {{ user.role === 'admin' ? 'Administrador' : 'Usuario' }}
                      </span>
                    </td>
                    <td>
                      <span class="status" [class.inactive]="!user.isActive">
                        {{ user.isActive ? 'Activo' : 'Suspendido' }}
                      </span>
                    </td>
                    <td class="cell-actions">
                      <button class="btn-icon" (click)="openEdit(user)" title="Editar">
                        <lucide-angular [img]="Pencil" size="15"></lucide-angular>
                      </button>
                      @if (!isSelf(user)) {
                        @if (user.isActive) {
                          <button class="btn-icon danger" (click)="suspend(user)" title="Suspender">
                            <lucide-angular [img]="Ban" size="15"></lucide-angular>
                          </button>
                        } @else {
                          <button class="btn-icon success" (click)="reactivate(user)" title="Reactivar">
                            <lucide-angular [img]="RotateCcw" size="15"></lucide-angular>
                          </button>
                        }
                      }
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5" class="empty-cell">Sin usuarios registrados</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      @if (editing(); as user) {
        <div class="modal-overlay" (click)="closeEdit()">
          <div class="modal animate-fade-in-down" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Editar usuario</h3>
              <button class="btn-icon" (click)="closeEdit()" title="Cerrar">
                <lucide-angular [img]="X" size="16"></lucide-angular>
              </button>
            </div>
            <form (ngSubmit)="saveEdit()">
              <div class="form-group">
                <label>Nombre</label>
                <input type="text" [(ngModel)]="editDraft.nombre" name="nombre" required />
              </div>
              <div class="form-group">
                <label>Correo electrónico</label>
                <input type="email" [(ngModel)]="editDraft.email" name="email" required />
              </div>
              <div class="form-group">
                <label>Rol</label>
                <select [(ngModel)]="editDraft.role" name="role" [disabled]="isSelf(user)">
                  <option value="user">Usuario</option>
                  <option value="admin">Administrador</option>
                </select>
                @if (isSelf(user)) {
                  <p class="field-hint">No puedes modificar tu propio rol</p>
                }
              </div>
              <button type="submit" class="btn-submit">
                <lucide-angular [img]="Check" size="16"></lucide-angular>
                Guardar cambios
              </button>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .admin-page { min-height: 100vh; background: #0a0e1a; padding: 2rem; color: white; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; animation: fadeInUp 0.4s ease-out; }
    .page-title { font-size: 1.75rem; font-weight: 800; margin: 0; letter-spacing: -0.5px; }
    .page-subtitle { color: rgba(255,255,255,0.4); margin: 0.25rem 0 0; font-size: 0.95rem; }
    .admin-nav { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; }
    .admin-nav a {
      color: rgba(255,255,255,0.5); text-decoration: none; font-size: 0.85rem; font-weight: 600;
      padding: 0.5rem 1rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.06); transition: all 0.2s;
    }
    .admin-nav a:hover { color: white; background: rgba(255,255,255,0.05); }
    .admin-nav a.active { color: #10B981; background: rgba(16,185,129,0.1); border-color: rgba(16,185,129,0.25); }
    .btn-new {
      display: flex; align-items: center; gap: 0.5rem; background: linear-gradient(135deg, #10B981, #059669);
      color: white; padding: 0.7rem 1.25rem; border: none; border-radius: 12px; font-weight: 600; font-size: 0.9rem;
      transition: all 0.3s; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2); cursor: pointer;
    }
    .btn-new:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(16, 185, 129, 0.35); }
    .form-card, .table-card {
      background: rgba(255,255,255,0.03); backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 1.5rem; margin-bottom: 1.5rem;
    }
    .form-card h3, .table-header h3 { margin: 0 0 1.25rem; font-size: 1rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; color: rgba(255,255,255,0.8); }
    .table-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; color: rgba(255,255,255,0.8); }
    .table-header h3 { margin: 0; }
    .count { background: rgba(16,185,129,0.12); color: #10B981; padding: 0.1rem 0.55rem; border-radius: 999px; font-size: 0.75rem; font-weight: 700; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; color: rgba(255,255,255,0.5); font-size: 0.85rem; margin-bottom: 0.4rem; font-weight: 500; }
    .form-group input, .form-group select {
      width: 100%; padding: 0.8rem 1rem; background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; color: white; box-sizing: border-box; transition: all 0.2s;
    }
    .form-group select option { background: #0a0e1a; color: white; }
    .form-group input:focus, .form-group select:focus { outline: none; border-color: #10B981; background: rgba(16, 185, 129, 0.05); box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1); }
    .form-group input::placeholder { color: rgba(255,255,255,0.2); }
    .field-hint { color: rgba(255,255,255,0.35); font-size: 0.75rem; margin: 0.4rem 0 0; }
    .btn-submit {
      width: 100%; padding: 0.85rem; background: linear-gradient(135deg, #10B981, #059669); border: none; border-radius: 12px;
      color: white; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: all 0.3s;
    }
    .btn-submit:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(16, 185, 129, 0.35); }
    .loading-text { color: rgba(255,255,255,0.4); text-align: center; padding: 2rem 0; margin: 0; }
    .table-scroll { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; color: rgba(255,255,255,0.4); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; padding: 0.6rem 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.06); }
    td { padding: 0.85rem 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 0.9rem; color: rgba(255,255,255,0.75); }
    tr:last-child td { border-bottom: none; }
    .cell-name { display: flex; align-items: center; gap: 0.5rem; font-weight: 600; color: white; }
    .self-badge { background: rgba(59,130,246,0.15); color: #3b82f6; font-size: 0.65rem; font-weight: 700; padding: 0.1rem 0.4rem; border-radius: 999px; }
    .badge { display: inline-flex; align-items: center; gap: 0.3rem; background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.6); padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.75rem; font-weight: 600; }
    .badge.admin { background: rgba(139, 92, 246, 0.15); color: #a78bfa; }
    .status { display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.8rem; font-weight: 600; color: #10B981; }
    .status::before { content: ''; width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
    .status.inactive { color: #F59E0B; }
    .cell-actions { display: flex; align-items: center; gap: 0.4rem; }
    .btn-icon {
      background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); color: rgba(255,255,255,0.6);
      width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; padding: 0;
    }
    .btn-icon:hover { background: rgba(255,255,255,0.1); color: white; }
    .btn-icon.danger:hover { background: rgba(239, 68, 68, 0.12); border-color: rgba(239, 68, 68, 0.3); color: #ef4444; }
    .btn-icon.success:hover { background: rgba(16, 185, 129, 0.12); border-color: rgba(16, 185, 129, 0.3); color: #10B981; }
    .empty-cell { text-align: center; color: rgba(255,255,255,0.3); padding: 2.5rem 0.75rem; }
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; padding: 1rem; z-index: 200; }
    .modal { background: #10162a; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 1.5rem; width: 100%; max-width: 440px; }
    .modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; }
    .modal-header h3 { margin: 0; font-size: 1.05rem; font-weight: 700; }
    @media (max-width: 768px) {
      .admin-page { padding: 1rem; }
      .page-header { flex-direction: column; gap: 0.75rem; align-items: stretch; }
      .btn-new { justify-content: center; }
      .form-row { grid-template-columns: 1fr; }
    }
    @media (max-width: 400px) {
      .admin-page { padding: 0.75rem; }
      .page-title { font-size: 1.35rem; }
      .page-subtitle { font-size: 0.85rem; }
      .form-card, .table-card { padding: 1rem; }
    }
  `]
})
export class AdminUsersComponent implements OnInit {
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private platformId = inject(PLATFORM_ID);

  Users = Users;
  UserPlus = UserPlus;
  Pencil = Pencil;
  Ban = Ban;
  RotateCcw = RotateCcw;
  X = X;
  Check = Check;
  ShieldCheck = ShieldCheck;

  loading = signal(true);
  users = signal<User[]>([]);
  showCreateForm = signal(false);
  editing = signal<User | null>(null);

  newUser: CreateUserRequest = { nombre: '', email: '', password: '', role: 'user' };
  editDraft: UpdateUserRequest = { nombre: '', email: '', role: 'user' };

  private readonly currentUserId = this.authService.getCurrentUser()?.id ?? '';

  ngOnInit(): void {
    // Admin data requires the JWT stored in localStorage, which only exists
    // in the browser: skip the request during SSR prerendering.
    if (!isPlatformBrowser(this.platformId)) {
      this.loading.set(false);
      return;
    }
    this.loadUsers();
  }

  loadUsers(): void {
    this.userService.getAll().subscribe({
      next: (data) => {
        this.users.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Error al cargar los usuarios');
      }
    });
  }

  toggleCreate(): void {
    this.showCreateForm.update((open) => !open);
  }

  isSelf(user: User): boolean {
    return user.id === this.currentUserId;
  }

  createUser(): void {
    this.userService.create(this.newUser).subscribe({
      next: () => {
        this.toast.success('Usuario creado exitosamente');
        this.showCreateForm.set(false);
        this.newUser = { nombre: '', email: '', password: '', role: 'user' };
        this.loadUsers();
      },
      error: (err) => this.toast.error(err.error?.message || 'Error al crear el usuario')
    });
  }

  openEdit(user: User): void {
    this.editing.set(user);
    this.editDraft = { nombre: user.nombre, email: user.email, role: user.role };
  }

  closeEdit(): void {
    this.editing.set(null);
  }

  saveEdit(): void {
    const user = this.editing();
    if (!user) return;

    this.userService.update(user.id, this.editDraft).subscribe({
      next: () => {
        this.toast.success('Usuario actualizado exitosamente');
        this.closeEdit();
        this.loadUsers();
      },
      error: (err) => this.toast.error(err.error?.message || 'Error al actualizar el usuario')
    });
  }

  suspend(user: User): void {
    this.userService.suspend(user.id).subscribe({
      next: () => {
        this.toast.success(`Cuenta de ${user.nombre} suspendida`);
        this.loadUsers();
      },
      error: (err) => this.toast.error(err.error?.message || 'Error al suspender la cuenta')
    });
  }

  reactivate(user: User): void {
    this.userService.reactivate(user.id).subscribe({
      next: () => {
        this.toast.success(`Cuenta de ${user.nombre} reactivada`);
        this.loadUsers();
      },
      error: (err) => this.toast.error(err.error?.message || 'Error al reactivar la cuenta')
    });
  }
}
