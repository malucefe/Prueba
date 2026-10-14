import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, ArrowLeftRight, Tag, DollarSign, Calendar, FileText, ArrowLeft, Check } from 'lucide-angular';
import { TransactionService } from '../../../core/services/transaction.service';
import { CategoryService } from '../../../core/services/category.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { CreateTransaction } from '../../../core/models/transaction.model';
import { Category } from '../../../core/models/category.model';

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule],
  template: `
    <div class="form-page">
      <div class="form-container animate-scale-in">
        <div class="form-header">
          <a routerLink="/transactions" class="btn-back">
            <lucide-angular [img]="ArrowLeft" size="18"></lucide-angular>
          </a>
          <h1>Nueva transacción</h1>
        </div>
        <form (ngSubmit)="onSubmit()" #form="ngForm">
          <div class="tipo-selector">
            <button type="button" class="tipo-btn" [class.active]="transaction.tipo === 'egreso'" [class.egreso]="transaction.tipo === 'egreso'" (click)="onTipoChange('egreso')">
              <lucide-angular [img]="ArrowLeftRight" size="18"></lucide-angular>
              Egreso
            </button>
            <button type="button" class="tipo-btn" [class.active]="transaction.tipo === 'ingreso'" [class.ingreso]="transaction.tipo === 'ingreso'" (click)="onTipoChange('ingreso')">
              <lucide-angular [img]="ArrowLeftRight" size="18"></lucide-angular>
              Ingreso
            </button>
          </div>
          <div class="form-group">
            <label>
              <lucide-angular [img]="Tag" size="14"></lucide-angular>
              Categoría
            </label>
            <select [(ngModel)]="transaction.categoriaId" name="categoriaId" required>
              <option value="">Seleccionar categoría...</option>
              @for (cat of categories(); track cat.id) {
                <option [value]="cat.id">{{ cat.nombre }}</option>
              }
            </select>
          </div>
          <div class="form-group">
            <label>
              <lucide-angular [img]="DollarSign" size="14"></lucide-angular>
              Monto (COP)
            </label>
            <input type="number" [(ngModel)]="transaction.monto" name="monto" required min="1" placeholder="0" />
          </div>
          <div class="form-group">
            <label>
              <lucide-angular [img]="Calendar" size="14"></lucide-angular>
              Fecha
            </label>
            <input type="date" [(ngModel)]="transaction.fecha" name="fecha" required />
          </div>
          <div class="form-group">
            <label>
              <lucide-angular [img]="FileText" size="14"></lucide-angular>
              Descripción <span class="optional">(opcional)</span>
            </label>
            <input type="text" [(ngModel)]="transaction.descripcion" name="descripcion" placeholder="Ej: Almuerzo en restaurante" />
          </div>
          <button type="submit" class="btn-submit" [disabled]="loading || !form.form.valid">
            @if (loading) {
              <span class="loading-spinner"></span>
            } @else {
              <lucide-angular [img]="Check" size="18"></lucide-angular>
              Guardar transacción
            }
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .form-page {
      min-height: 100vh;
      background: #0a0e1a;
      padding: 2rem;
      color: white;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding-top: 3rem;
    }
    .form-container {
      width: 100%;
      max-width: 520px;
      background: rgba(255,255,255,0.03);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 20px;
      padding: 2rem;
    }
    .form-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .btn-back {
      width: 40px;
      height: 40px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: rgba(255,255,255,0.6);
      transition: all 0.2s;
    }
    .btn-back:hover { background: rgba(255,255,255,0.1); color: white; }
    .form-header h1 {
      margin: 0;
      font-size: 1.35rem;
      font-weight: 700;
    }
    .tipo-selector {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }
    .tipo-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.85rem;
      background: rgba(255,255,255,0.03);
      border: 2px solid rgba(255,255,255,0.06);
      border-radius: 12px;
      color: rgba(255,255,255,0.5);
      font-weight: 600;
      font-size: 0.95rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .tipo-btn:hover { border-color: rgba(255,255,255,0.15); }
    .tipo-btn.active.egreso {
      background: rgba(239, 68, 68, 0.1);
      border-color: rgba(239, 68, 68, 0.3);
      color: #ef4444;
    }
    .tipo-btn.active.ingreso {
      background: rgba(16, 185, 129, 0.1);
      border-color: rgba(16, 185, 129, 0.3);
      color: #10B981;
    }
    .form-group {
      margin-bottom: 1.25rem;
    }
    .form-group label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: rgba(255,255,255,0.6);
      font-size: 0.85rem;
      font-weight: 500;
      margin-bottom: 0.5rem;
    }
    .optional { color: rgba(255,255,255,0.3); font-weight: 400; }
    .form-group input, .form-group select {
      width: 100%;
      padding: 0.85rem 1rem;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px;
      color: white;
      font-size: 1rem;
      box-sizing: border-box;
      transition: all 0.2s;
    }
    .form-group input:focus, .form-group select:focus {
      outline: none;
      border-color: #10B981;
      background: rgba(16, 185, 129, 0.05);
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
    }
    .form-group input::placeholder { color: rgba(255,255,255,0.2); }
    .form-group select option { background: #0a0e1a; }
    .btn-submit {
      width: 100%;
      padding: 0.95rem;
      background: linear-gradient(135deg, #10B981, #059669);
      border: none;
      border-radius: 12px;
      color: white;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }
    .btn-submit:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(16, 185, 129, 0.35);
    }
    .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
    .loading-spinner {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (max-width: 768px) {
      .form-page { padding: 1rem; padding-top: 1.5rem; }
      .form-container { padding: 1.5rem; border-radius: 16px; }
      .tipo-selector { gap: 0.5rem; }
    }
    @media (max-width: 400px) {
      .form-page { padding: 0.75rem; padding-top: 1rem; }
      .form-container { padding: 1.25rem; border-radius: 14px; }
      .form-header h1 { font-size: 1.2rem; }
      .tipo-selector { gap: 0.4rem; }
      .tipo-btn { padding: 0.7rem 0.5rem; font-size: 0.85rem; }
      .btn-submit { padding: 0.85rem; }
    }
  `]
})
export class TransactionFormComponent implements OnInit {
  private transactionService = inject(TransactionService);
  private categoryService = inject(CategoryService);
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);
  private toast = inject(ToastService);

  ArrowLeft = ArrowLeft;
  ArrowLeftRight = ArrowLeftRight;
  Tag = Tag;
  DollarSign = DollarSign;
  Calendar = Calendar;
  FileText = FileText;
  Check = Check;

  categories = signal<Category[]>([]);
  loading = false;

  transaction: CreateTransaction = {
    tipo: 'egreso',
    monto: 0,
    categoriaId: '',
    descripcion: '',
    fecha: new Date().toISOString().split('T')[0]
  };

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.loadCategories('egreso');
  }

  loadCategories(tipo: 'ingreso' | 'egreso'): void {
    this.categoryService.getAll(tipo).subscribe({
      next: (cats) => this.categories.set(cats)
    });
  }

  onTipoChange(tipo: 'ingreso' | 'egreso'): void {
    this.transaction.tipo = tipo;
    this.transaction.categoriaId = '';
    this.loadCategories(tipo);
  }

  onSubmit(): void {
    this.loading = true;
    this.transactionService.create(this.transaction).subscribe({
      next: () => {
        this.toast.success('Transacción creada exitosamente');
        this.router.navigate(['/transactions']);
      },
      error: (err) => {
        this.loading = false;
        this.toast.error(err.error?.message || 'Error al crear la transacción');
      }
    });
  }
}
