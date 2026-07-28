-- ZER-22 — el creador de una tarea puede cancelarla desde el menú `···` del
-- detalle o de la pantalla de editar.
--
-- Cancelar es un cambio de estado, no un borrado: `tasks` no tiene policy de
-- DELETE y la tarea cancelada tiene que seguir siendo auditable (quién la
-- publicó, cuándo, quién la había tomado).
--
-- No hace falta tocar grants: `estado` ya está en el `grant update` por columna
-- de 20260725160000_grants_por_columna.sql. La policy "Serranos can update
-- tasks they took" tampoco cambia: ya permite escribir al `creado_por`, y la
-- restricción de que *sólo* el creador cancele la aplica `cancelTask` en el
-- action y en el filtro del update.

alter type task_estado add value 'cancelada';
