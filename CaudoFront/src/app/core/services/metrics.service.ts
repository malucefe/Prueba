import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { MetricsResponse } from '../models/metrics.model';

@Injectable({ providedIn: 'root' })
export class MetricsService {
  constructor(private api: ApiService) {}

  // Métricas globales de uso (HU-21): solo admin, filtradas por rango [desde, hasta]
  getMetrics(desde: string, hasta: string): Observable<MetricsResponse> {
    return this.api.get<MetricsResponse>('/metrics', { desde, hasta });
  }
}
