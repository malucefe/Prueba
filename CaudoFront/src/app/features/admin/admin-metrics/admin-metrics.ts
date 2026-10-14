import { Component, OnInit, ChangeDetectionStrategy, inject, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  provideCharts,
  withDefaultRegisterables,
  BaseChartDirective,
} from 'ng2-charts';
import { LucideAngularModule, Users, UserCheck, Activity, Brain, CalendarDays, TrendingUp } from 'lucide-angular';
import { MetricsService } from '../../../core/services/metrics.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { CopCurrencyPipe } from '../../../shared/pipes/cop-currency.pipe';
import { MetricsResponse } from '../../../core/models/metrics.model';

@Component({
  selector: 'app-admin-metrics',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterModule, BaseChartDirective, LucideAngularModule, CopCurrencyPipe],
  providers: [provideCharts(withDefaultRegisterables())],
  template: `
    <div class="admin-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Métricas de uso</h1>
          <p class="page-subtitle">Indicadores globales de la plataforma por rango de fechas</p>
        </div>
        <div class="date-filters">
          <div class="date-field">
            <label for="metrics-desde">Desde</label>
            <div class="date-input">
              <lucide-angular [img]="CalendarDays" size="15"></lucide-angular>
              <input
                id="metrics-desde"
                type="date"
                [value]="desde()"
                (change)="onDateChange('desde', $event)"
              />
            </div>
          </div>
          <div class="date-field">
            <label for="metrics-hasta">Hasta</label>
            <div class="date-input">
              <lucide-angular [img]="CalendarDays" size="15"></lucide-angular>
              <input
                id="metrics-hasta"
                type="date"
                [value]="hasta()"
                (change)="onDateChange('hasta', $event)"
              />
            </div>
          </div>
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
          <p class="loading-text">Cargando métricas...</p>
        </div>
      } @else if (metrics(); as m) {
        <div class="summary-cards">
          <div class="card card-users animate-fade-in-up" style="animation-delay: 0.1s">
            <div class="card-icon icon-users">
              <lucide-angular [img]="Users" size="20"></lucide-angular>
            </div>
            <span class="card-label">Usuarios registrados</span>
            <span class="card-value">{{ m.usuariosTotales }}</span>
          </div>
          <div class="card card-active animate-fade-in-up" style="animation-delay: 0.2s">
            <div class="card-icon icon-active">
              <lucide-angular [img]="UserCheck" size="20"></lucide-angular>
            </div>
            <span class="card-label">Usuarios activos en el período</span>
            <span class="card-value">{{ m.usuariosActivos }}</span>
          </div>
          <div class="card card-tx animate-fade-in-up" style="animation-delay: 0.3s">
            <div class="card-icon icon-tx">
              <lucide-angular [img]="Activity" size="20"></lucide-angular>
            </div>
            <span class="card-label">Transacciones en el período</span>
            <span class="card-value">{{ m.transacciones.total }}</span>
          </div>
          <div class="card card-recs animate-fade-in-up" style="animation-delay: 0.4s">
            <div class="card-icon icon-recs">
              <lucide-angular [img]="Brain" size="20"></lucide-angular>
            </div>
            <span class="card-label">Recomendaciones generadas</span>
            <span class="card-value">{{ m.recomendacionesGeneradas }}</span>
          </div>
        </div>

        <div class="chart-card animate-fade-in-up" style="animation-delay: 0.5s">
          <div class="chart-header">
            <h3><lucide-angular [img]="TrendingUp" size="18"></lucide-angular> Ingresos vs egresos por día</h3>
            <div class="chart-totals">
              <span class="total-income">Ingresos: {{ m.transacciones.ingresos | copCurrency }}</span>
              <span class="total-expense">Egresos: {{ m.transacciones.egresos | copCurrency }}</span>
            </div>
          </div>
          @if (chartData.labels.length === 0) {
            <p class="chart-empty">Sin transacciones en el rango seleccionado</p>
          } @else {
            <div class="chart-wrapper">
              <canvas baseChart [type]="'bar'" [data]="chartData" [options]="barOptions" height="300"></canvas>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .admin-page { min-height: 100vh; background: #0a0e1a; padding: 2rem; color: white; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1.5rem; margin-bottom: 1.5rem; animation: fadeInUp 0.4s ease-out; }
    .page-title { font-size: 1.75rem; font-weight: 800; margin: 0; letter-spacing: -0.5px; }
    .page-subtitle { color: rgba(255,255,255,0.4); margin: 0.25rem 0 0; font-size: 0.95rem; }
    .date-filters { display: flex; gap: 0.75rem; }
    .date-field label { display: block; color: rgba(255,255,255,0.5); font-size: 0.75rem; font-weight: 600; margin-bottom: 0.35rem; text-transform: uppercase; letter-spacing: 0.5px; }
    .date-input {
      display: flex; align-items: center; gap: 0.5rem; padding: 0.55rem 0.85rem;
      background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; color: rgba(255,255,255,0.6); transition: all 0.2s;
    }
    .date-input:focus-within { border-color: #10B981; background: rgba(16, 185, 129, 0.05); box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1); }
    .date-input input { background: transparent; border: none; color: white; font-family: inherit; font-size: 0.85rem; outline: none; color-scheme: dark; }
    .admin-nav { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; }
    .admin-nav a {
      color: rgba(255,255,255,0.5); text-decoration: none; font-size: 0.85rem; font-weight: 600;
      padding: 0.5rem 1rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.06); transition: all 0.2s;
    }
    .admin-nav a:hover { color: white; background: rgba(255,255,255,0.05); }
    .admin-nav a.active { color: #10B981; background: rgba(16,185,129,0.1); border-color: rgba(16,185,129,0.25); }
    .table-card {
      background: rgba(255,255,255,0.03); backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 1.5rem;
    }
    .loading-text { color: rgba(255,255,255,0.4); text-align: center; padding: 2rem 0; margin: 0; }
    .summary-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; margin-bottom: 1.5rem; }
    .card {
      background: rgba(255,255,255,0.03); backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 1.5rem;
      transition: all 0.3s; position: relative; overflow: hidden;
    }
    .card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; border-radius: 16px 16px 0 0; }
    .card-users::before { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
    .card-active::before { background: linear-gradient(90deg, #10B981, #34d399); }
    .card-tx::before { background: linear-gradient(90deg, #F59E0B, #fbbf24); }
    .card-recs::before { background: linear-gradient(90deg, #8b5cf6, #a78bfa); }
    .card:hover { transform: translateY(-4px); border-color: rgba(255,255,255,0.1); box-shadow: 0 12px 40px rgba(0,0,0,0.3); }
    .card-icon { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; }
    .icon-users { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
    .icon-active { background: rgba(16, 185, 129, 0.15); color: #10B981; }
    .icon-tx { background: rgba(245, 158, 11, 0.15); color: #F59E0B; }
    .icon-recs { background: rgba(139, 92, 246, 0.15); color: #a78bfa; }
    .card-label { color: rgba(255,255,255,0.5); font-size: 0.85rem; font-weight: 500; display: block; margin-bottom: 0.5rem; }
    .card-value { font-size: 1.6rem; font-weight: 800; letter-spacing: -0.5px; }
    .chart-card {
      background: rgba(255,255,255,0.03); backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 1.5rem;
    }
    .chart-header { display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
    .chart-header h3 { margin: 0; font-size: 0.95rem; font-weight: 600; color: rgba(255,255,255,0.7); display: flex; align-items: center; gap: 0.5rem; }
    .chart-totals { display: flex; gap: 1rem; font-size: 0.85rem; font-weight: 600; }
    .total-income { color: #10B981; }
    .total-expense { color: #ef4444; }
    .chart-wrapper { position: relative; width: 100%; height: 300px; overflow: hidden; }
    .chart-empty { text-align: center; color: rgba(255,255,255,0.3); padding: 2rem 0; font-size: 0.9rem; margin: 0; }
    @media (max-width: 768px) {
      .admin-page { padding: 1rem; }
      .page-header { flex-direction: column; gap: 1rem; align-items: stretch; }
      .date-filters { flex-wrap: wrap; }
      .date-field { flex: 1; min-width: 150px; }
      .admin-nav { flex-wrap: wrap; }
      .summary-cards { grid-template-columns: 1fr; }
      .chart-wrapper { height: 230px; }
    }
    @media (max-width: 400px) {
      .admin-page { padding: 0.75rem; }
      .page-title { font-size: 1.35rem; }
      .page-subtitle { font-size: 0.85rem; }
      .chart-card { padding: 1rem; }
      .chart-wrapper { height: 180px; }
    }
  `]
})
export class AdminMetricsComponent implements OnInit {
  private metricsService = inject(MetricsService);
  private toast = inject(ToastService);
  private platformId = inject(PLATFORM_ID);

  Users = Users;
  UserCheck = UserCheck;
  Activity = Activity;
  Brain = Brain;
  CalendarDays = CalendarDays;
  TrendingUp = TrendingUp;

  loading = signal(true);
  metrics = signal<MetricsResponse | null>(null);

  // Default: primer día del mes actual → hoy (mismo default que el backend)
  desde = signal('');
  hasta = signal('');

  chartData = {
    labels: [] as string[],
    datasets: [
      { label: 'Ingresos', data: [] as number[], backgroundColor: 'rgba(16, 185, 129, 0.8)', borderRadius: 8, borderSkipped: false },
      { label: 'Egresos', data: [] as number[], backgroundColor: 'rgba(239, 68, 68, 0.8)', borderRadius: 8, borderSkipped: false }
    ]
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
    // Admin data requires the JWT stored in localStorage, which only exists
    // in the browser: skip the request during SSR prerendering.
    if (!isPlatformBrowser(this.platformId)) {
      this.loading.set(false);
      return;
    }
    const hoy = new Date();
    this.desde.set(this.formatDate(new Date(hoy.getFullYear(), hoy.getMonth(), 1)));
    this.hasta.set(this.formatDate(hoy));
    this.loadMetrics();
  }

  onDateChange(campo: 'desde' | 'hasta', event: Event): void {
    const valor = (event.target as HTMLInputElement).value;
    if (!valor) return;

    if (campo === 'desde') {
      this.desde.set(valor);
    } else {
      this.hasta.set(valor);
    }
    // Recalcula solo el período, sin recargar la página (CA2)
    this.loadMetrics();
  }

  private loadMetrics(): void {
    this.loading.set(true);
    this.metricsService.getMetrics(this.desde(), this.hasta()).subscribe({
      next: (data) => {
        this.metrics.set(data);
        this.updateChart(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(err.error?.message || 'Error al cargar las métricas');
      }
    });
  }

  private updateChart(data: MetricsResponse): void {
    this.chartData.labels = data.transaccionesPorDia.map((d) =>
      `${d.fecha.slice(8, 10)}/${d.fecha.slice(5, 7)}`
    );
    this.chartData.datasets[0].data = data.transaccionesPorDia.map((d) => d.ingresos);
    this.chartData.datasets[1].data = data.transaccionesPorDia.map((d) => d.egresos);
  }

  /** YYYY-MM-DD en local, para que el default coincida con el día del admin. */
  private formatDate(date: Date): string {
    const anio = date.getFullYear();
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const dia = String(date.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }
}
