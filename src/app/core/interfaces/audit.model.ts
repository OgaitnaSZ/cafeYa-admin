export type AuditAccion = 'CREATE' | 'UPDATE' | 'DELETE';

export interface Log {
  id:              number;
  created_at:      Date;

  // Quién
  usuario_id:      string | null;
  nombre_usuario:  string | null;
  rol_usuario:     string | null;

  // Qué
  accion:          AuditAccion;
  entidad:         string;
  entidad_id:      string;
  descripcion:     string;

  // Diff
  cambios: {
    antes:   Record<string, unknown> | null;
    despues: Record<string, unknown> | null;
  } | null;

  // Contexto
  ip:         string | null;
  user_agent: string | null;
}