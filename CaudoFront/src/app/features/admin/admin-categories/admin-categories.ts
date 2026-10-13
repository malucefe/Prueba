import { Component, OnInit, ChangeDetectionStrategy, inject, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, Tags, Plus, Pencil, Trash2, Ban, RotateCcw, X, Check } from 'lucide-angular';
import { CategoryService } from '../../../core/services/category.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { Category, CreateCategoryRequest, UpdateCategoryRequest } from '../../../core/models/category.model';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
  template: `
    <div class="admin-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Catálogos globales</h1>
          <p class="page-subtitle">Gestiona las categorías disponibles para registrar transacciones</p>
        </div>
        <button class="btn-new" (click)="toggleCreate()">
          <lucide-angular [img]="showCreateForm() ? X : Plus" size="18"></lucide-angular>
          {{ showCreateForm() ? 'Cancelar' : 'Nueva categoría' }}
        </button>
      </div>

      <nav class="admin-nav">
        <a routerLink="/admin" [routerLinkActiveOptions]="{ exact: true }" routerLinkActive="active">Usuarios</a>
        <a routerLink="/admin/categorias" routerLinkActive="active">Categorías</a>
        <a routerLink="/admin/reglas" routerLinkActive="active">Reglas del motor</a>
      </nav>

      @if (loading()) {
        <div class="table-card">
          <p class="loading-text">Cargando categorías...</p>
        </div>
      } @else {
        @if (showCreateForm()) {
          <div class="form-card animate-fade-in-down">
            <h3>
              <lucide-angular [img]="Plus" size="18"></lucide-angular>
              Crear categoría
            </h3>
            <form (ngSubmit)="createCategory()">
              <div class="form-row">
                <div class="form-group">
                  <label>Nombre</label>
                  <input type="text" [(ngModel)]="newCategory.nombre" name="nombre" required placeholder="Ej: Mascotas" />
                </div>
                <div class="form-group">
                  <label>Tipo</label>
                  <select [(ngModel)]="newCategory.tipo" name="tipo" required>
                    <option value="egreso">Egreso</option>
                    <option value="ingreso">Ingreso</option>
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label>Icono (opcional)</label>
                <input type="text" [(ngModel)]="newCategory.icono" name="icono" placeholder="Ej: 🐶" />
              </div>
              <button type="submit" class="btn-submit">
                <lucide-angular [img]="Check" size="16"></lucide-angular>
                Crear categoría
              </button>
            </form>
          </div>
        }

        <div class="table-card">
          <div class="table-header">
            <lucide-angular [img]="Tags" size="18"></lucide-angular>
            <h3>Categorías de transacciones</h3>
            <span class="count">{{ categories().length }}</span>
          </div>
          <div class="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Tipo</th>
                  <th>Icono</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (category of categories(); track category.id) {
                  <tr>
                    <td class="cell-name">{{ category.nombre }}</td>
                    <td>
                      <span class="badge" [class.ingreso]="category.tipo === 'ingreso'">
                        {{ category.tipo === 'ingreso' ? 'Ingreso' : 'Egreso' }}
                      </span>
                    </td>
                    <td class="cell-icon">{{ category.icono || '—' }}</td>
                    <td>
                      <span class="status" [class.inactive]="!category.activo">
                        {{ category.activo ? 'Activa' : 'Inactiva' }}
                      </span>
                    </td>
                    <td class="cell-actions">
                      <button class="btn-icon" (click)="openEdit(category)" title="Editar">
                        <lucide-angular [img]="Pencil" size="15"></lucide-angular>
                      </button>
                      @if (category.activo) {
                        <button class="btn-icon danger" (click)="toggleActive(category)" title="Desactivar">
                          <lucide-angular [img]="Ban" size="15"></lucide-angular>
                        </button>
                      } @else {
                        <button class="btn-icon success" (click)="toggleActive(category)" title="Activar">
                          <lucide-angular [img]="RotateCcw" size="15"></lucide-angular>
                        </button>
                      }
                      <button class="btn-icon danger" (click)="remove(category)" title="Eliminar">
                        <lucide-angular [img]="Trash2" size="15"></lucide-angular>
                      </button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5" class="empty-cell">Sin categorías registradas</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      @if (editing(); as category) {
        <div class="modal-overlay" (click)="closeEdit()">
          <div class="modal animate-fade-in-down" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Editar categoría</h3>
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
                <label>Icono</label>
                <input type="text" [(ngModel)]="editDraft.icono" name="icono" placeholder="Ej: 🚌" />
              </div>
              <div class="form-group checkbox-group">
                <label>
                  <input type="checkbox" [(ngModel)]="editDraft.activo" name="activo" />
                  Categoría activa (visible en el selector de transacciones)
                </label>
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
    .checkbox-group label { display: flex; align-items: center; gap: 0.5rem; color: rgba(255,255,255,0.7); cursor: pointer; }
    .checkbox-group input[type='checkbox'] { width: auto; accent-color: #10B981; }
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
    .cell-name { font-weight: 600; color: white; }
    .cell-icon { font-size: 1.1rem; }
    .badge { display: inline-flex; align-items: center; gap: 0.3rem; background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.6); padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.75rem; font-weight: 600; }
    .badge.ingreso { background: rgba(16, 185, 129, 0.15); color: #10B981; }
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
      .admin-nav { flex-wrap: wrap; }
    }
    @media (max-width: 400px) {
      .admin-page { padding: 0.75rem; }
      .page-title { font-size: 1.35rem; }
      .page-subtitle { font-size: 0.85rem; }
      .form-card, .table-card { padding: 1rem; }
    }
  `]
})
export class AdminCategoriesComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private toast = inject(ToastService);
  private platformId = inject(PLATFORM_ID);

  Tags = Tags;
  Plus = Plus;
  Pencil = Pencil;
  Trash2 = Trash2;
  Ban = Ban;
  RotateCcw = RotateCcw;
  X = X;
  Check = Check;

  loading = signal(true);
  categories = signal<Category[]>([]);
  showCreateForm = signal(false);
  editing = signal<Category | null>(null);

  newCategory: CreateCategoryRequest = { nombre: '', tipo: 'egreso', icono: '' };
  editDraft: UpdateCategoryRequest = { nombre: '', icono: '', activo: true };

  ngOnInit(): void {
    // Admin data requires the JWT stored in localStorage, which only exists
    // in the browser: skip the request during SSR prerendering.
    if (!isPlatformBrowser(this.platformId)) {
      this.loading.set(false);
      return;
    }
    this.loadCategories();
  }

  loadCategories(): void {
    this.categoryService.getAllForAdmin().subscribe({
      next: (data) => {
        this.categories.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Error al cargar las categorías');
      }
    });
  }

  toggleCreate(): void {
    this.showCreateForm.update((open) => !open);
  }

  createCategory(): void {
    this.categoryService.create(this.newCategory).subscribe({
      next: () => {
        this.toast.success('Categoría creada: ya está disponible en el selector de transacciones');
        this.showCreateForm.set(false);
        this.newCategory = { nombre: '', tipo: 'egreso', icono: '' };
        this.loadCategories();
      },
      error: (err) => this.toast.error(err.error?.message || 'Error al crear la categoría')
    });
  }

  openEdit(category: Category): void {
    this.editing.set(category);
    this.editDraft = { nombre: category.nombre, icono: category.icono, activo: category.activo };
  }

  closeEdit(): void {
    this.editing.set(null);
  }

  saveEdit(): void {
    const category = this.editing();
    if (!category) return;

    this.categoryService.update(category.id, this.editDraft).subscribe({
      next: () => {
        this.toast.success('Categoría actualizada exitosamente');
        this.closeEdit();
        this.loadCategories();
      },
      error: (err) => this.toast.error(err.error?.message || 'Error al actualizar la categoría')
    });
  }

  toggleActive(category: Category): void {
    this.categoryService.update(category.id, { activo: !category.activo }).subscribe({
      next: () => {
        this.toast.success(
          category.activo
            ? `Categoría "${category.nombre}" desactivada`
            : `Categoría "${category.nombre}" activada`
        );
        this.loadCategories();
      },
      error: (err) => this.toast.error(err.error?.message || 'Error al cambiar el estado de la categoría')
    });
  }

  remove(category: Category): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const confirmed = window.confirm(
      `¿Eliminar la categoría "${category.nombre}"? Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    this.categoryService.remove(category.id).subscribe({
      next: () => {
        this.toast.success(`Categoría "${category.nombre}" eliminada`);
        this.loadCategories();
      },
      // CA esc.2 (HU-20): el backend responde 409 con un mensaje que
      // sugiere desactivar la categoría; se muestra tal cual al admin.
      error: (err) =>
        this.toast.error(
          err.error?.message ||
            'No se pudo eliminar la categoría. Si tiene transacciones asociadas, desactívala en su lugar.'
        )
    });
  }
}
