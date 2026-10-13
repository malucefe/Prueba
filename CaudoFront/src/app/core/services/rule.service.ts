import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { RecommendationRule, UpdateRuleRequest } from '../models/rule.model';

@Injectable({ providedIn: 'root' })
export class RuleService {
  constructor(private api: ApiService) {}

  // Catálogo fijo de reglas del motor (HU-20): solo lectura y edición, sin crear ni eliminar
  getAll(): Observable<RecommendationRule[]> {
    return this.api.get<RecommendationRule[]>('/rules');
  }

  update(id: string, data: UpdateRuleRequest): Observable<RecommendationRule> {
    return this.api.patch<RecommendationRule>(`/rules/${id}`, data);
  }
}
