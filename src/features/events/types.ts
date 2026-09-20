export type AgendaEvent = {
  id: string;
  titulo: string;
  descripcion: string | null;
  lugar: string | null;
  inicio: string;
  fin: string | null;
  creado_por: string;
};
