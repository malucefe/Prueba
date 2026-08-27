import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Recommendation } from '../models/recommendation.model';

@Injectable({ providedIn: 'root' })
export class RecommendationService {
  constructor(private api: ApiService) {}

  getAll(noLeidas?: boolean): Observable<Recommendation[]> {
    const params = noLeidas ? { noLeidas: 'true' } : undefined;
    return this.api.get<Recommendation[]>('/recommendations', params);
  }

  getById(id: string): Observable<Recommendation> {
    return this.api.get<Recommendation>(`/recommendations/${id}`);
  }

  markAsRead(id: string): Observable<void> {
    return this.api.patch<void>(`/recommendations/${id}/read`, {});
  }

  markAllAsRead(): Observable<void> {
    return this.api.patch<void>('/recommendations/read-all', {});
  }

  getUnreadCount(): Observable<{ count: number }> {
    return this.api.get<{ count: number }>('/recommendations/unread-count');
  }
}
