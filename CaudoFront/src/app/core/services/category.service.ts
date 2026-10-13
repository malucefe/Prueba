import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '../models/category.model';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  constructor(private api: ApiService) {}

  getAll(tipo?: 'ingreso' | 'egreso'): Observable<Category[]> {
    const params = tipo ? { tipo } : undefined;
    return this.api.get<Category[]>('/categories', params);
  }

  // Métodos admin (HU-20): requieren JWT con rol admin
  getAllForAdmin(): Observable<Category[]> {
    return this.api.get<Category[]>('/categories', { includeInactive: 'true' });
  }

  create(data: CreateCategoryRequest): Observable<Category> {
    return this.api.post<Category>('/categories', data);
  }

  update(id: string, data: UpdateCategoryRequest): Observable<Category> {
    return this.api.patch<Category>(`/categories/${id}`, data);
  }

  remove(id: string): Observable<{ success: boolean }> {
    return this.api.delete<{ success: boolean }>(`/categories/${id}`);
  }
}
