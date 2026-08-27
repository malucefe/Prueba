import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const GOALS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./goals-list/goals-list').then(m => m.GoalsListComponent), canActivate: [authGuard] }
];
