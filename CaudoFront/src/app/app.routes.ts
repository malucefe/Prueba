import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },
  { path: 'auth', loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES) },
  { path: 'dashboard', loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES), canActivate: [authGuard] },
  { path: 'transactions', loadChildren: () => import('./features/transactions/transactions.routes').then(m => m.TRANSACTIONS_ROUTES), canActivate: [authGuard] },
  { path: 'goals', loadChildren: () => import('./features/goals/goals.routes').then(m => m.GOALS_ROUTES), canActivate: [authGuard] },
  { path: 'profile', loadChildren: () => import('./features/profile/profile.routes').then(m => m.PROFILE_ROUTES), canActivate: [authGuard] },
  { path: '**', redirectTo: 'auth/login' }
];
