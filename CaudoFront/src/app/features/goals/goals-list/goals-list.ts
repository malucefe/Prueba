import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Plus, Target, Trash2, Calendar, TrendingUp, Check, X } from 'lucide-angular';
import { SkeletonCardComponent } from '../../../shared/components/skeleton/skeleton-card';
import { CopCurrencyPipe } from '../../../shared/pipes/cop-currency.pipe';
import { GoalService } from '../../../core/services/goal.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { Goal, CreateGoal } from '../../../core/models/goal.model';

@Component({
  selector: 'app-goals-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, SkeletonCardComponent, CopCurrencyPipe],
  template: `
    <div class="goals-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Metas financieras</h1>
          <p class="page-subtitle">Define y sigue tus objetivos de ahorro</p>
        </div>
        <button class="btn-new" (click)="showForm = !showForm">
          <lucide-angular [img]="showForm ? X : Plus" size="18"></lucide-angular>
          {{ showForm ? 'Cancelar' : 'Nueva meta' }}
        </button>
      </div>

      @if (loading()) {
        <div class="goals-grid">
          @for (i of [1,2,3]; track i) { <app-skeleton-card /> }
        </div>
      } @else {
        @if (showForm) {
          <div class="form-card animate-fade-in-down">
            <h3><lucide-angular [img]="Target" size="18"></lucide-angular> Nueva meta</h3>
            <form (ngSubmit)="createGoal()">
              <div class="form-group">
                <label>Nombre de la meta</label>
                <input type="text" [(ngModel)]="newGoal.nombre" name="nombre" required placeholder="Ej: Fondo de emergencia" />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Monto objetivo</label>
                  <input type="number" [(ngModel)]="newGoal.montoObjetivo" name="montoObjetivo" required min="1" placeholder="0" />
                </div>
                <div class="form-group">
                  <label>Fecha límite</label>
                  <input type="date" [(ngModel)]="newGoal.fechaLimite" name="fechaLimite" required />
                </div>
              </div>
              <button type="submit" class="btn-submit">
                <lucide-angular [img]="Check" size="16"></lucide-angular>
                Crear meta
              </button>
            </form>
          </div>
        }

        <div class="goals-grid">
          @for (goal of goals(); track goal.id) {
            <div class="goal-card animate-fade-in-up">
              <div class="goal-header">
                <div class="goal-icon">
                  <lucide-angular [img]="Target" size="20"></lucide-angular>
                </div>
                <div class="goal-title-section">
                  <h3>{{ goal.nombre }}</h3>
                  <span class="goal-date">
                    <lucide-angular [img]="Calendar" size="12"></lucide-angular>
                    {{ goal.fechaLimite | date:'dd MMM yyyy' }}
                  </span>
                </div>
                <button class="btn-delete" (click)="deleteGoal(goal.id)" title="Eliminar">
                  <lucide-angular [img]="Trash2" size="16"></lucide-angular>
                </button>
              </div>
              <div class="goal-amounts">
                <span class="current">{{ goal.montoActual | copCurrency }}</span>
                <span class="separator">de</span>
                <span class="target">{{ goal.montoObjetivo | copCurrency }}</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" [style.width.%]="getProgress(goal)"></div>
              </div>
              <div class="goal-footer">
                <span class="goal-percent">{{ getProgress(goal) | number:'1.0-0' }}% completado</span>
                @if (getProgress(goal) >= 100) {
                  <span class="goal-complete">¡Meta alcanzada! 🎉</span>
                }
              </div>
              <div class="goal-add">
                <input type="number" #addInput placeholder="Agregar monto" />
                <button (click)="addToGoal(goal, addInput)">
                  <lucide-angular [img]="TrendingUp" size="16"></lucide-angular>
                </button>
              </div>
            </div>
          } @empty {
            <div class="empty-state">
              <lucide-angular [img]="Target" size="48"></lucide-angular>
              <h3>Sin metas aún</h3>
              <p>Crea tu primera meta de ahorro para empezar</p>
              <button class="btn-new" (click)="showForm = true">
                <lucide-angular [img]="Plus" size="18"></lucide-angular>
                Crear meta
              </button>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .goals-page {
      min-height: 100vh;
      background: #0a0e1a;
      padding: 2rem;
      color: white;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
      animation: fadeInUp 0.4s ease-out;
    }
    .page-title {
      font-size: 1.75rem;
      font-weight: 800;
      margin: 0;
      letter-spacing: -0.5px;
    }
    .page-subtitle {
      color: rgba(255,255,255,0.4);
      margin: 0.25rem 0 0;
      font-size: 0.95rem;
    }
    .btn-new {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: linear-gradient(135deg, #10B981, #059669);
      color: white;
      padding: 0.7rem 1.25rem;
      border: none;
      border-radius: 12px;
      font-weight: 600;
      font-size: 0.9rem;
      transition: all 0.3s;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
    }
    .btn-new:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(16, 185, 129, 0.35);
    }
    .form-card {
      background: rgba(255,255,255,0.03);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 16px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }
    .form-card h3 {
      margin: 0 0 1.25rem;
      font-size: 1rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: rgba(255,255,255,0.8);
    }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; color: rgba(255,255,255,0.5); font-size: 0.85rem; margin-bottom: 0.4rem; font-weight: 500; }
    .form-group input {
      width: 100%; padding: 0.8rem 1rem; background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; color: white; box-sizing: border-box;
      transition: all 0.2s;
    }
    .form-group input:focus { outline: none; border-color: #10B981; background: rgba(16, 185, 129, 0.05); box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1); }
    .form-group input::placeholder { color: rgba(255,255,255,0.2); }
    .btn-submit {
      width: 100%; padding: 0.85rem; background: linear-gradient(135deg, #10B981, #059669); border: none; border-radius: 12px;
      color: white; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem;
      transition: all 0.3s;
    }
    .btn-submit:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(16, 185, 129, 0.35); }
    .goals-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.25rem; }
    .goal-card {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 16px;
      padding: 1.5rem;
      transition: all 0.3s;
    }
    .goal-card:hover {
      border-color: rgba(255,255,255,0.1);
      transform: translateY(-4px);
      box-shadow: 0 12px 40px rgba(0,0,0,0.3);
    }
    .goal-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem; }
    .goal-icon {
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(59, 130, 246, 0.15));
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #10B981;
      flex-shrink: 0;
    }
    .goal-title-section { flex: 1; }
    .goal-title-section h3 { margin: 0; font-size: 1.05rem; font-weight: 700; }
    .goal-date { color: rgba(255,255,255,0.3); font-size: 0.8rem; display: flex; align-items: center; gap: 0.3rem; margin-top: 0.25rem; }
    .btn-delete {
      background: transparent; border: 1px solid rgba(239,68,68,0.15); color: rgba(239,68,68,0.5);
      width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; cursor: pointer;
      transition: all 0.2s;
    }
    .btn-delete:hover { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.3); color: #ef4444; }
    .goal-amounts { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; }
    .current { font-weight: 700; font-size: 1.1rem; color: #10B981; }
    .separator { color: rgba(255,255,255,0.3); font-size: 0.85rem; }
    .target { color: rgba(255,255,255,0.5); font-size: 0.95rem; }
    .progress-bar { height: 10px; background: rgba(255,255,255,0.06); border-radius: 5px; overflow: hidden; margin-bottom: 0.5rem; }
    .progress-fill { height: 100%; background: linear-gradient(90deg, #10B981, #34d399); border-radius: 5px; transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1); }
    .goal-footer { display: flex; justify-content: space-between; align-items: center; }
    .goal-percent { color: #10B981; font-weight: 600; font-size: 0.85rem; }
    .goal-complete { color: #F59E0B; font-size: 0.85rem; font-weight: 600; }
    .goal-add { display: flex; gap: 0.5rem; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.06); }
    .goal-add input { flex: 1; padding: 0.7rem 1rem; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; color: white; }
    .goal-add input:focus { outline: none; border-color: #10B981; }
    .goal-add input::placeholder { color: rgba(255,255,255,0.2); }
    .goal-add button { width: 42px; background: linear-gradient(135deg, #10B981, #059669); border: none; border-radius: 10px; color: white; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
    .goal-add button:hover { transform: scale(1.05); box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); }
    .empty-state {
      text-align: center; padding: 4rem 2rem; color: rgba(255,255,255,0.3); grid-column: 1 / -1;
    }
    .empty-state h3 { margin: 1rem 0 0.5rem; color: rgba(255,255,255,0.5); }
    .empty-state p { margin: 0 0 1.5rem; }
    .empty-state .btn-new { margin: 0 auto; width: fit-content; }
    @media (max-width: 768px) {
      .goals-page { padding: 1rem; }
      .page-header { flex-direction: column; gap: 0.75rem; align-items: stretch; }
      .btn-new { justify-content: center; }
      .form-row { grid-template-columns: 1fr; }
      .goals-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 400px) {
      .goals-page { padding: 0.75rem; }
      .page-title { font-size: 1.35rem; }
      .page-subtitle { font-size: 0.85rem; }
      .goal-card { padding: 1rem; }
      .form-card { padding: 1rem; }
      .goal-header { gap: 0.5rem; }
      .goal-amounts { flex-wrap: wrap; }
      .goal-icon { width: 38px; height: 38px; }
      .goal-add input { padding: 0.6rem 0.85rem; font-size: 0.9rem; }
      .goal-add button { width: 38px; }
    }
  `]
})
export class GoalsListComponent implements OnInit {
  private goalService = inject(GoalService);
  private toast = inject(ToastService);
  private platformId = inject(PLATFORM_ID);

  Plus = Plus;
  X = X;
  Target = Target;
  Calendar = Calendar;
  Trash2 = Trash2;
  TrendingUp = TrendingUp;
  Check = Check;

  loading = signal(true);
  goals = signal<Goal[]>([]);
  showForm = false;

  newGoal: CreateGoal = { nombre: '', montoObjetivo: 0, fechaLimite: '' };

  ngOnInit(): void {
    // Solo en browser: en SSR se conserva el skeleton (loading) inicial.
    if (isPlatformBrowser(this.platformId)) {
      this.loadGoals();
    }
  }

  loadGoals(): void {
    this.goalService.getAll().subscribe({
      next: (data) => {
        this.goals.set(data);
        this.loading.set(false);
      }
    });
  }

  createGoal(): void {
    this.goalService.create(this.newGoal).subscribe({
      next: () => {
        this.toast.success('Meta creada exitosamente');
        this.showForm = false;
        this.newGoal = { nombre: '', montoObjetivo: 0, fechaLimite: '' };
        this.loadGoals();
      },
      error: () => this.toast.error('Error al crear la meta')
    });
  }

  deleteGoal(id: string): void {
    this.goalService.delete(id).subscribe({
      next: () => {
        this.toast.success('Meta eliminada');
        this.loadGoals();
      }
    });
  }

  addToGoal(goal: Goal, input: HTMLInputElement): void {
    const amount = parseFloat(input.value);
    if (!amount || amount <= 0) return;
    this.goalService.update(goal.id, { montoActual: goal.montoActual + amount }).subscribe({
      next: () => {
        this.toast.success(`$${amount.toLocaleString('es-CO')} agregados a "${goal.nombre}"`);
        input.value = '';
        this.loadGoals();
      }
    });
  }

  getProgress(goal: Goal): number {
    if (goal.montoObjetivo === 0) return 0;
    return Math.min((goal.montoActual / goal.montoObjetivo) * 100, 100);
  }
}
