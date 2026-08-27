import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Goal, CreateGoal, UpdateGoal } from '../models/goal.model';

@Injectable({ providedIn: 'root' })
export class GoalService {
  constructor(private api: ApiService) {}

  getAll(): Observable<Goal[]> {
    return this.api.get<Goal[]>('/goals');
  }

  getById(id: string): Observable<Goal> {
    return this.api.get<Goal>(`/goals/${id}`);
  }

  create(data: CreateGoal): Observable<Goal> {
    return this.api.post<Goal>('/goals', data);
  }

  update(id: string, data: UpdateGoal): Observable<Goal> {
    return this.api.put<Goal>(`/goals/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`/goals/${id}`);
  }
}
