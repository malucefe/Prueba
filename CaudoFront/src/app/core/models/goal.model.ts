export interface Goal {
  id: string;
  userId: string;
  nombre: string;
  montoObjetivo: number;
  montoActual: number;
  fechaLimite: string;
  createdAt: string;
}

export interface CreateGoal {
  nombre: string;
  montoObjetivo: number;
  fechaLimite: string;
}

export interface UpdateGoal {
  nombre?: string;
  montoObjetivo?: number;
  montoActual?: number;
  fechaLimite?: string;
}
