export interface Category {
  id: string;
  nombre: string;
  tipo: 'ingreso' | 'egreso';
  icono: string;
  // HU-20: las categorías se desactivan en lugar de eliminarse cuando ya
  // tienen transacciones asociadas.
  activo: boolean;
}

export interface CreateCategoryRequest {
  nombre: string;
  tipo: 'ingreso' | 'egreso';
  icono?: string;
}

export interface UpdateCategoryRequest {
  nombre?: string;
  icono?: string;
  activo?: boolean;
}
