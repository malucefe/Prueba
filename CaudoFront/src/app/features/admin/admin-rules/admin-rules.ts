import { Component, OnInit, ChangeDetectionStrategy, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, SlidersHorizontal, Pencil, Ban, RotateCcw, X, Check } from 'lucide-angular';
import { RuleService } from '../../../core/services/rule.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { RecommendationRule, UpdateRuleRequest } from '../../../core/models/rule.model';

interface ParamMeta {
  label: string;
  format?: (value: number) => string;
}

@Component({
  selector: 'app-admin-rules',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
  template: `
    <div class="admin-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Reglas del motor de recomendaciones</h1>
          <p class="page-subtitle">Los cambios se reflejan en las próximas recomendaciones que genere n8n</p>
        </div>
      </div>

      <nav class="admin-nav">
        <a routerLink="/admin" [routerLinkActiveOptions]="{ exact: true }" routerLinkActive="active">Usuarios</a>
        <a routerLink="/admin/categorias" routerLinkActive="active">Categorías</a>
        <a routerLink="/admin/reglas" routerLinkActive="active">Reglas del motor</a>
        <a routerLink="/admin/metricas" routerLinkActive="active">Métricas</a>
      </nav>

      @if (loading()) {
        <div class="table-card">
          <p class="loading-text">Cargando reglas...</p>
        </div>
      } @else {
        <div class="table-card">
          <div class="table-header">
            <lucide-angular [img]="SlidersHorizontal" size="18"></lucide-angular>
            <h3>Catálogo de reglas</h3>
            <span class="count">{{ rules().length }}</span>
          </div>
          <div class="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Regla</th>
                  <th>Umbrales</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (rule of rules(); track rule.id) {
                  <tr>
                    <td class="cell-name">
                      <span class="key-badge">{{ rule.key }}</span>
                      {{ rule.nombre }}
                    </td>
                    <td class="cell-params">{{ summary(rule) }}</td>
                    <td>
                      <span class="status" [class.inactive]="!rule.activa">
                        {{ rule.activa ? 'Activa' : 'Desactivada' }}
                      </span>
                    </td>
                    <td class="cell-actions">
                      <button class="btn-icon" (click)="openEdit(rule)" title="Editar">
                        <lucide-angular [img]="Pencil" size="15"></lucide-angular>
                      </button>
                      @if (rule.activa) {
                        <button class="btn-icon danger" (click)="toggleActive(rule)" title="Desactivar">
                          <lucide-angular [img]="Ban" size="15"></lucide-angular>
                        </button>
                      } @else {
                        <button class="btn-icon success" (click)="toggleActive(rule)" title="Activar">
                          <lucide-angular [img]="RotateCcw" size="15"></lucide-angular>
                        </button>
                      }
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="4" class="empty-cell">Sin reglas configuradas</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      @if (editing(); as rule) {
        <div class="modal-overlay" (click)="closeEdit()">
          <div class="modal animate-fade-in-down" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Editar regla: {{ rule.nombre }}</h3>
              <button class="btn-icon" (click)="closeEdit()" title="Cerrar">
                <lucide-angular [img]="X" size="16"></lucide-angular>
              </button>
            </div>
            <form (ngSubmit)="saveEdit()">
              @for (param of editParams(); track param.key) {
                <div class="form-group">
                  <label>{{ param.label }}</label>
                  <input
                    type="number"
                    step="any"
                    [ngModel]="param.value"
                    (ngModelChange)="setParam(param.key, $event)"
                    [name]="param.key"
                  />
                </div>
              }
              <div class="form-group">
                <label>Plantilla del mensaje</label>
                <textarea
                  rows="3"
                  [(ngModel)]="editDraft.plantilla"
                  name="plantilla"
                  placeholder="Mensaje mostrado al usuario"
                ></textarea>
                <p class="field-hint">Puede usar variables como $&#123;cat&#125; o $&#123;porcentaje&#125; según la regla</p>
              </div>
              <div class="form-group checkbox-group">
                <label>
                  <input type="checkbox" [(ngModel)]="editDraft.activa" name="activa" />
                  Regla activa (participa en la generación de recomendaciones)
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
    .form-card, .table-card {
      background: rgba(255,255,255,0.03); backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 1.5rem; margin-bottom: 1.5rem;
    }
    .table-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; color: rgba(255,255,255,0.8); }
    .table-header h3 { margin: 0; font-size: 1rem; font-weight: 600; }
    .count { background: rgba(16,185,129,0.12); color: #10B981; padding: 0.1rem 0.55rem; border-radius: 999px; font-size: 0.75rem; font-weight: 700; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; color: rgba(255,255,255,0.5); font-size: 0.85rem; margin-bottom: 0.4rem; font-weight: 500; }
    .form-group input, .form-group textarea {
      width: 100%; padding: 0.8rem 1rem; background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; color: white; box-sizing: border-box; transition: all 0.2s;
      font-family: inherit; resize: vertical;
    }
    .form-group input:focus, .form-group textarea:focus { outline: none; border-color: #10B981; background: rgba(16, 185, 129, 0.05); box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1); }
    .field-hint { color: rgba(255,255,255,0.35); font-size: 0.75rem; margin: 0.4rem 0 0; }
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
    .cell-name { display: flex; align-items: center; gap: 0.5rem; font-weight: 600; color: white; }
    .key-badge { background: rgba(139, 92, 246, 0.15); color: #a78bfa; font-size: 0.65rem; font-weight: 700; padding: 0.15rem 0.45rem; border-radius: 999px; text-transform: uppercase; }
    .cell-params { max-width: 380px; color: rgba(255,255,255,0.6); font-size: 0.82rem; }
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
    .modal { background: #10162a; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 1.5rem; width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; }
    .modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; }
    .modal-header h3 { margin: 0; font-size: 1.05rem; font-weight: 700; }
    @media (max-width: 768px) {
      .admin-page { padding: 1rem; }
      .page-header { flex-direction: column; gap: 0.75rem; align-items: stretch; }
      .admin-nav { flex-wrap: wrap; }
    }
    @media (max-width: 400px) {
      .admin-page { padding: 0.75rem; }
      .page-title { font-size: 1.35rem; }
      .page-subtitle { font-size: 0.85rem; }
      .table-card { padding: 1rem; }
    }
  `]
})
export class AdminRulesComponent implements OnInit {
  private ruleService = inject(RuleService);
  private toast = inject(ToastService);
  private platformId = inject(PLATFORM_ID);

  SlidersHorizontal = SlidersHorizontal;
  Pencil = Pencil;
  Ban = Ban;
  RotateCcw = RotateCcw;
  X = X;
  Check = Check;

  loading = signal(true);
  rules = signal<RecommendationRule[]>([]);
  editing = signal<RecommendationRule | null>(null);

  editDraft: UpdateRuleRequest & { parametros: Record<string, number> } = {
    parametros: {},
    plantilla: '',
    activa: true,
  };

  editParams = computed(() =>
    Object.entries(this.editDraft.parametros).map(([key, value]) => ({
      key,
      label: this.paramMeta[key]?.label ?? key,
      value,
    }))
  );

  private readonly paramMeta: Record<string, ParamMeta> = {
    umbralPorcentaje: { label: 'Umbral de gasto por categoría (%)', format: (v) => `${v}%` },
    ratioMaximo: { label: 'Ratio máximo de gastos sobre ingresos', format: (v) => `${Math.round(v * 100)}%` },
    porcentajeAhorro: { label: 'Ahorro recomendado (% de ingresos)', format: (v) => `${v}%` },
    minMovimientos: { label: 'Mínimo de movimientos repetidos', format: (v) => `${v}` },
    varianzaMaxima: { label: 'Varianza máxima de montos', format: (v) => `${Math.round(v * 100)}%` },
    stddevDias: { label: 'Desviación estándar máxima (días)', format: (v) => `${v} días` },
  };

  ngOnInit(): void {
    // Admin data requires the JWT stored in localStorage, which only exists
    // in the browser: skip the request during SSR prerendering.
    if (!isPlatformBrowser(this.platformId)) {
      this.loading.set(false);
      return;
    }
    this.loadRules();
  }

  loadRules(): void {
    this.ruleService.getAll().subscribe({
      next: (data) => {
        this.rules.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Error al cargar las reglas');
      }
    });
  }

  summary(rule: RecommendationRule): string {
    return Object.entries(rule.parametros ?? {})
      .map(([key, value]) => {
        const meta = this.paramMeta[key];
        const numeric = Number(value);
        const formatted =
          meta?.format && Number.isFinite(numeric) ? meta.format(numeric) : String(value);
        return `${meta?.label ?? key}: ${formatted}`;
      })
      .join(' · ');
  }

  openEdit(rule: RecommendationRule): void {
    const parametros: Record<string, number> = {};
    Object.entries(rule.parametros ?? {}).forEach(([key, value]) => {
      parametros[key] = Number(value);
    });

    this.editing.set(rule);
    this.editDraft = { parametros, plantilla: rule.plantilla, activa: rule.activa };
  }

  closeEdit(): void {
    this.editing.set(null);
  }

  setParam(key: string, value: unknown): void {
    this.editDraft = {
      ...this.editDraft,
      parametros: { ...this.editDraft.parametros, [key]: Number(value) },
    };
  }

  saveEdit(): void {
    const rule = this.editing();
    if (!rule) return;

    this.ruleService.update(rule.id, {
      parametros: this.editDraft.parametros,
      plantilla: this.editDraft.plantilla,
      activa: this.editDraft.activa,
    }).subscribe({
      next: () => {
        this.toast.success('Regla actualizada: n8n la usará en las próximas recomendaciones');
        this.closeEdit();
        this.loadRules();
      },
      error: (err) => this.toast.error(err.error?.message || 'Error al actualizar la regla')
    });
  }

  toggleActive(rule: RecommendationRule): void {
    this.ruleService.update(rule.id, { activa: !rule.activa }).subscribe({
      next: () => {
        this.toast.success(
          rule.activa
            ? `Regla "${rule.nombre}" desactivada`
            : `Regla "${rule.nombre}" activada`
        );
        this.loadRules();
      },
      error: (err) => this.toast.error(err.error?.message || 'Error al cambiar el estado de la regla')
    });
  }
}
