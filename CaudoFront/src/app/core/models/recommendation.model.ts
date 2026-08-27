export interface Recommendation {
  id: string;
  userId: string;
  contenido: string;
  tipo: 'alerta' | 'consejo' | 'meta' | 'ahorro';
  leida: boolean;
  createdAt: string;
}
