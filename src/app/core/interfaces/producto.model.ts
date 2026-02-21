export interface Producto {
  producto_id?: string;
  nombre: string;
  descripcion: string;
  precio_unitario: number;
  imagen_url: string;
  categoria_id: number;
  categoria?: Categoria;
  estado: estado_producto;
  destacado: boolean;
}

export type estado_producto = 'Activo' | 'Inactivo';

export interface Categoria {
  categoria_id: number;
  nombre: string;
  emoji: string;
  count?: number;
}