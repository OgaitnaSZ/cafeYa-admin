export interface Producto {
  producto_id?: string;
  nombre: string;
  descripcion: string;
  categoria_id: number;
  categoria?: Categoria;
  imagen_url: string;
  precio_unitario: number;
  destacado: boolean;
  estado: estado_producto;
  stock: number;
}

export type estado_producto = 'Activo' | 'Inactivo';

export interface Categoria {
  categoria_id: number;
  nombre: string;
  emoji: string;
  count?: number;
}