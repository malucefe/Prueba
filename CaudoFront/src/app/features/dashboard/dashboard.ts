import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  provideCharts,
  withDefaultRegisterables,
  BaseChartDirective,
} from 'ng2-charts';
import { LucideAngularModule, TrendingUp, TrendingDown, Wallet, Target, Brain, ArrowUpRight, ArrowDownRight, Plus } from 'lucide-angular';
import { SkeletonCardComponent } from '../../shared/components/skeleton/skeleton-card';
import { CopCurrencyPipe } from '../../shared/pipes/cop-currency.pipe';
import { TransactionService } from '../../core/services/transaction.service';
import { RecommendationService } from '../../core/services/recommendation.service';
import { GoalService } from '../../core/services/goal.service';
import { TransactionSummary, MonthlyTrend } from '../../core/models/transaction.model';
import { Recommendation } from '../../core/models/recommendation.model';
import { Goal } from '../../core/models/goal.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, BaseChartDirective, LucideAngularModule, SkeletonCardComponent, CopCurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideCharts(withDefaultRegisterables())],
  template: `
    <div class="dashboard">
      @if (loading()) {
        <div class="summary-cards">
          @for (i of [1,2,3]; track i) { <app-skeleton-card /> }
        </div>
        <div class="charts-grid">
          <app-skeleton-card />
          <app-skeleton-card />
        </div>
      } @else if (error()) {
        <div class="error-state">
          <p>{{ error() }}</p>
        </div>
      } @else {
        <div class="dashboard-header">
          <div>
            <h1 class="page-title">Dashboard</h1>
            <p class="page-subtitle">Resumen de tus finanzas este mes</p>
          </div>
          <a routerLink="/transactions/new" class="btn-new">
            <lucide-angular [img]="Plus" size="18"></lucide-angular>
            Nueva transacción
          </a>
        </div>

        <div class="summary-cards">
          <div class="card card-income animate-fade-in-up" style="animation-delay: 0.1s">
            <div class="card-header">
              <div class="card-icon icon-income">
                <lucide-angular [img]="TrendingUp" size="20"></lucide-angular>
              </div>
              <span class="card-trend text-green">+12%</span>
            </div>
            <span class="card-label">Ingresos</span>
            <span class="card-value">{{ summary().ingresos | copCurrency }}</span>
          </div>
          <div class="card card-expense animate-fade-in-up" style="animation-delay: 0.2s">
            <div class="card-header">
              <div class="card-icon icon-expense">
                <lucide-angular [img]="TrendingDown" size="20"></lucide-angular>
              </div>
              <span class="card-trend text-red">-8%</span>
            </div>
            <span class="card-label">Egresos</span>
            <span class="card-value">{{ summary().egresos | copCurrency }}</span>
          </div>
          <div class="card card-balance animate-fade-in-up" style="animation-delay: 0.3s" [class.negative]="summary().balance < 0">
            <div class="card-header">
              <div class="card-icon icon-balance">
                <lucide-angular [img]="Wallet" size="20"></lucide-angular>
              </div>
            </div>
            <span class="card-label">Balance</span>
            <span class="card-value">{{ summary().balance | copCurrency }}</span>
          </div>
        </div>

        <div class="charts-grid">
          <div class="chart-card animate-fade-in-up" style="animation-delay: 0.4s">
            <h3><lucide-angular [img]="Target" size="18"></lucide-angular> Gastos por categoría</h3>
            @if (categoryChartData.labels.length === 0) {
              <p class="chart-empty">Registra gastos para ver el desglose</p>
            } @else {
              <div class="chart-wrapper">
                <canvas baseChart [type]="'doughnut'" [data]="categoryChartData" [options]="doughnutOptions" height="280"></canvas>
              </div>
            }
          </div>
          <div class="chart-card animate-fade-in-up" style="animation-delay: 0.5s">
            <h3><lucide-angular [img]="TrendingUp" size="18"></lucide-angular> Balance mensual</h3>
            <div class="chart-wrapper">
              <canvas baseChart [type]="'bar'" [data]="balanceChartData" [options]="barOptions" height="280"></canvas>
            </div>
          </div>
        </div>

        <div class="bottom-grid">
          <div class="panel animate-fade-in-up" style="animation-delay: 0.6s">
            <h3><lucide-angular [img]="Brain" size="18"></lucide-angular> Recomendaciones IA</h3>
            @if (recommendations().length === 0) {
              <p class="empty-msg">Crea transacciones para recibir recomendaciones personalizadas</p>
            } @else {
              <div class="recommendations-list">
                @for (rec of recommendations(); track rec.id) {
                  <div class="rec-item" [class.rec-unread]="!rec.leida" (click)="markRead(rec)">
                    <span class="rec-type" [class]="rec.tipo">{{ rec.tipo }}</span>
                    <p>{{ rec.contenido }}</p>
                    <span class="rec-date">{{ rec.createdAt | date:'dd MMM yyyy' }}</span>
                  </div>
                }
              </div>
            }
          </div>

          <div class="panel animate-fade-in-up" style="animation-delay: 0.7s">
            <h3><lucide-angular [img]="Target" size="18"></lucide-angular> Metas financieras</h3>
            @if (goals().length === 0) {
              <p class="empty-msg">Aún no tienes metas. ¡Crea tu primera meta!</p>
            } @else {
              <div class="goals-list">
                @for (goal of goals(); track goal.id) {
                  <div class="goal-item">
                    <div class="goal-header">
                      <span class="goal-name">{{ goal.nombre }}</span>
                      <span class="goal-amount">{{ goal.montoActual | copCurrency }} <span class="separator">/</span> {{ goal.montoObjetivo | copCurrency }}</span>
                    </div>
                    <div class="progress-bar">
                      <div class="progress-fill" [style.width.%]="getProgress(goal)"></div>
                    </div>
                    <span class="goal-percent">{{ getProgress(goal) | number:'1.0-0' }}% completado</span>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard {
      min-height: 100vh;
      background: #0a0e1a;
      padding: 2rem;
      color: white;
    }
    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
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
    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.25rem;
      margin-bottom: 2rem;
    }
    .card {
      background: rgba(255,255,255,0.03);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 16px;
      padding: 1.5rem;
      transition: all 0.3s;
      position: relative;
      overflow: hidden;
    }
    .card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      border-radius: 16px 16px 0 0;
    }
    .card-income::before { background: linear-gradient(90deg, #10B981, #34d399); }
    .card-expense::before { background: linear-gradient(90deg, #ef4444, #f87171); }
    .card-balance::before { background: linear-gradient(90deg, #F59E0B, #fbbf24); }
    .card-balance.negative::before { background: linear-gradient(90deg, #ef4444, #f87171); }
    .card:hover {
      transform: translateY(-4px);
      border-color: rgba(255,255,255,0.1);
      box-shadow: 0 12px 40px rgba(0,0,0,0.3);
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    .card-icon {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .icon-income { background: rgba(16, 185, 129, 0.15); color: #10B981; }
    .icon-expense { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
    .icon-balance { background: rgba(245, 158, 11, 0.15); color: #F59E0B; }
    .card-trend {
      font-size: 0.8rem;
      font-weight: 600;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
    }
    .text-green { color: #10B981; background: rgba(16, 185, 129, 0.1); }
    .text-red { color: #ef4444; background: rgba(239, 68, 68, 0.1); }
    .card-label { color: rgba(255,255,255,0.5); font-size: 0.85rem; font-weight: 500; display: block; margin-bottom: 0.5rem; }
    .card-value { font-size: 1.6rem; font-weight: 800; letter-spacing: -0.5px; }
    .card-income .card-value { color: #10B981; }
    .card-expense .card-value { color: #ef4444; }
    .card-balance .card-value { color: #F59E0B; }
    .card-balance.negative .card-value { color: #ef4444; }
    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 1.25rem;
      margin-bottom: 2rem;
    }
    .chart-card {
      background: rgba(255,255,255,0.03);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 16px;
      padding: 1.5rem;
    }
    .chart-card h3 {
      margin: 0 0 1.25rem;
      font-size: 0.95rem;
      font-weight: 600;
      color: rgba(255,255,255,0.7);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .chart-wrapper {
      position: relative;
      width: 100%;
      height: 280px;
      overflow: hidden;
    }
    .chart-empty {
      text-align: center;
      color: rgba(255,255,255,0.3);
      padding: 2rem 0;
      font-size: 0.9rem;
    }
    .bottom-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
      gap: 1.25rem;
    }
    .panel {
      background: rgba(255,255,255,0.03);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 16px;
      padding: 1.5rem;
    }
    .panel h3 {
      margin: 0 0 1.25rem;
      font-size: 0.95rem;
      font-weight: 600;
      color: rgba(255,255,255,0.7);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .empty-msg {
      color: rgba(255,255,255,0.3);
      font-size: 0.9rem;
      text-align: center;
      padding: 2rem 0;
    }
    .error-state {
      text-align: center;
      padding: 3rem 2rem;
      color: rgba(239, 68, 68, 0.8);
      font-size: 0.95rem;
    }
    .rec-item {
      padding: 1rem;
      border-radius: 12px;
      background: rgba(255,255,255,0.02);
      margin-bottom: 0.75rem;
      cursor: pointer;
      transition: all 0.2s;
      border: 1px solid transparent;
    }
    .rec-item:hover {
      background: rgba(255,255,255,0.04);
      border-color: rgba(255,255,255,0.06);
    }
    .rec-unread {
      border-left: 3px solid #F59E0B;
      background: rgba(245, 158, 11, 0.03);
    }
    .rec-type {
      font-size: 0.7rem;
      text-transform: uppercase;
      font-weight: 700;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      letter-spacing: 0.5px;
    }
    .rec-type.alerta { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
    .rec-type.ahorro { background: rgba(16, 185, 129, 0.15); color: #10B981; }
    .rec-type.consejo { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
    .rec-item p {
      margin: 0.6rem 0;
      font-size: 0.9rem;
      color: rgba(255,255,255,0.7);
      line-height: 1.5;
    }
    .rec-date {
      font-size: 0.75rem;
      color: rgba(255,255,255,0.3);
    }
    .goal-item { margin-bottom: 1.25rem; }
    .goal-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.6rem;
    }
    .goal-name { font-weight: 600; font-size: 0.95rem; }
    .goal-amount { color: rgba(255,255,255,0.5); font-size: 0.85rem; }
    .separator { color: rgba(255,255,255,0.2); }
    .progress-bar {
      height: 8px;
      background: rgba(255,255,255,0.06);
      border-radius: 4px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #10B981, #34d399);
      border-radius: 4px;
      transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .goal-percent {
      font-size: 0.8rem;
      color: #10B981;
      margin-top: 0.35rem;
      display: block;
      font-weight: 600;
    }
    @media (max-width: 768px) {
      .dashboard { padding: 1rem; }
      .dashboard-header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
      }
      .btn-new {
        justify-content: center;
        text-align: center;
      }
      .summary-cards { grid-template-columns: 1fr; }
      .charts-grid { grid-template-columns: 1fr; }
      .bottom-grid { grid-template-columns: 1fr; }
      .chart-wrapper { height: 230px; }
      .card-value { font-size: 1.4rem; }
    }

    @media (max-width: 400px) {
      .dashboard { padding: 0.75rem; }
      .dashboard-header { margin-bottom: 1.25rem; }
      .page-title { font-size: 1.35rem; }
      .summary-cards { gap: 0.75rem; }
      .charts-grid { gap: 0.75rem; margin-bottom: 1.25rem; }
      .bottom-grid { gap: 0.75rem; }
      .card { padding: 1rem; }
      .card-value { font-size: 1.25rem; }
      .chart-card { padding: 1rem; }
      .chart-wrapper { height: 180px; }
      .panel { padding: 1rem; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  private transactionService = inject(TransactionService);
  private recommendationService = inject(RecommendationService);
  private goalService = inject(GoalService);

  TrendingUp = TrendingUp;
  TrendingDown = TrendingDown;
  Wallet = Wallet;
  Target = Target;
  Brain = Brain;
  Plus = Plus;

  loading = signal(true);
  error = signal<string | null>(null);
  summary = signal<TransactionSummary>({
    mes: 0, anio: 0, ingresos: 0, egresos: 0, balance: 0, porCategoria: []
  });
  recommendations = signal<Recommendation[]>([]);
  goals = signal<Goal[]>([]);

  categoryChartData = {
    labels: [] as string[],
    datasets: [{
      data: [] as number[],
      backgroundColor: ['#10B981', '#F59E0B', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#06b6d4', '#84cc16', '#6366f1'],
      borderWidth: 0,
      hoverOffset: 8
    }]
  };

  balanceChartData = {
    labels: [] as string[],
    datasets: [
      { label: 'Ingresos', data: [] as number[], backgroundColor: 'rgba(16, 185, 129, 0.8)', borderRadius: 8, borderSkipped: false },
      { label: 'Egresos', data: [] as number[], backgroundColor: 'rgba(239, 68, 68, 0.8)', borderRadius: 8, borderSkipped: false }
    ]
  };

  doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { color: 'rgba(255,255,255,0.6)', font: { size: 11 }, padding: 12, usePointStyle: true, pointStyleWidth: 10 }
      }
    },
    cutout: '65%'
  };

  barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { color: 'rgba(255,255,255,0.6)', font: { size: 11 }, padding: 12, usePointStyle: true, pointStyleWidth: 10 }
      }
    },
    scales: {
      x: { ticks: { color: 'rgba(255,255,255,0.4)' }, grid: { display: false } },
      y: { ticks: { color: 'rgba(255,255,255,0.4)' }, grid: { color: 'rgba(255,255,255,0.04)' } }
    }
  };

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    const now = new Date();
    const mes = now.getMonth() + 1;
    const anio = now.getFullYear();

    this.error.set(null);

    this.transactionService.getSummary(mes, anio).subscribe({
      next: (data) => {
        this.summary.set(data);
        this.updateCategoryChart(data);
      },
      error: () => {
        this.error.set('No se pudo cargar el resumen financiero. Verifica tu conexión.');
      }
    });

    this.transactionService.getTrend(6).subscribe({
      next: (data) => this.updateBalanceChart(data),
      error: () => {
        if (!this.error()) {
          this.error.set('Error al cargar las tendencias mensuales.');
        }
      }
    });

    this.recommendationService.getAll().subscribe({
      next: (data) => this.recommendations.set(data.slice(0, 5)),
      error: () => {
        if (!this.error()) {
          this.error.set('Error al cargar las recomendaciones.');
        }
      }
    });

    this.goalService.getAll().subscribe({
      next: (data) => this.goals.set(data),
      error: () => {
        if (!this.error()) {
          this.error.set('Error al cargar las metas.');
        }
      }
    });

    setTimeout(() => this.loading.set(false), 600);
  }

  private updateCategoryChart(summary: TransactionSummary): void {
    const egresoCats = summary.porCategoria.filter((c: any) => c.tipo === 'egreso');
    this.categoryChartData.labels = egresoCats.map((c: any) => c.categoria);
    this.categoryChartData.datasets[0].data = egresoCats.map((c: any) => c.total);
  }

  private updateBalanceChart(trends: MonthlyTrend[]): void {
    const months = [...new Set(trends.map(t => t.mes))];
    this.balanceChartData.labels = months;
    this.balanceChartData.datasets[0].data = months.map(m => {
      const found = trends.find(t => t.mes === m && t.tipo === 'ingreso');
      return found ? found.total : 0;
    });
    this.balanceChartData.datasets[1].data = months.map(m => {
      const found = trends.find(t => t.mes === m && t.tipo === 'egreso');
      return found ? found.total : 0;
    });
  }

  getProgress(goal: Goal): number {
    if (goal.montoObjetivo === 0) return 0;
    return Math.min((goal.montoActual / goal.montoObjetivo) * 100, 100);
  }

  markRead(rec: Recommendation): void {
    if (!rec.leida) {
      this.recommendationService.markAsRead(rec.id).subscribe();
      rec.leida = true;
    }
  }
}
