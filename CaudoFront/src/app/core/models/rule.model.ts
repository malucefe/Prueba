export interface RecommendationRule {
  id: string;
  key: string;
  nombre: string;
  parametros: Record<string, unknown>;
  plantilla: string;
  activa: boolean;
}

export interface UpdateRuleRequest {
  parametros?: Record<string, unknown>;
  plantilla?: string;
  activa?: boolean;
}
