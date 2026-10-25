/**
 * ZER-177: success feedback after a server action redirects. The action adds
 * `?ok=<code>` to its redirect target and <ActionNotice> on the destination
 * shows the matching message. Only codes listed here render, so the URL can
 * never inject text into the page.
 */

export const ACTION_NOTICE_PARAM = "ok";

const MESSAGES = {
  "proyecto-creado": "Proyecto creado",
  "proyecto-actualizado": "Cambios del proyecto guardados",
  "proyecto-archivado": "Proyecto archivado",
  "proyecto-abandonado": "Saliste del proyecto",
  "evento-creado": "Evento creado",
  "evento-actualizado": "Cambios del evento guardados",
  "evento-eliminado": "Evento eliminado",
  "tarea-creada": "Tarea creada",
  "tarea-actualizada": "Cambios de la tarea guardados",
  "tarea-tomada": "Tomaste la tarea",
  "tarea-liberada": "Liberaste la tarea",
  "tarea-asignada": "Tarea asignada",
  "tarea-completada": "Marcaste la tarea como hecha",
  "tarea-verificada": "Tarea verificada",
  "tarea-cancelada": "Tarea cancelada",
} as const;

export type ActionNoticeCode = keyof typeof MESSAGES;

export function withActionNotice(path: string, code: ActionNoticeCode): string {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}${ACTION_NOTICE_PARAM}=${code}`;
}

export function actionNoticeMessage(raw: string | null | undefined): string | null {
  if (!raw || !Object.hasOwn(MESSAGES, raw)) return null;
  return MESSAGES[raw as ActionNoticeCode];
}
