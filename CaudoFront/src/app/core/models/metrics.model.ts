export interface TransactionTotals {
  total: number;
  ingresos: number;
  egresos: number;
}

export interface DailyTransactions {
  fecha: string;
  ingresos: number;
  egresos: number;
}

// Respuesta de GET /api/metrics (HU-21): métricas globales de uso por período
export interface MetricsResponse {
  desde: string;
  hasta: string;
  usuariosTotales: number;
  usuariosActivos: number;
  transacciones: TransactionTotals;
  recomendacionesGeneradas: number;
  transaccionesPorDia: DailyTransactions[];
}
