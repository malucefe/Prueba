import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { adminGuard } from '../../core/guards/admin.guard';

export const ADMIN_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./admin-users/admin-users').then(m => m.AdminUsersComponent), canActivate: [authGuard, adminGuard] },
  { path: 'categorias', loadComponent: () => import('./admin-categories/admin-categories').then(m => m.AdminCategoriesComponent), canActivate: [authGuard, adminGuard] },
  { path: 'reglas', loadComponent: () => import('./admin-rules/admin-rules').then(m => m.AdminRulesComponent), canActivate: [authGuard, adminGuard] }
];
