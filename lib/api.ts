import { getChatGPTUser } from '@/app/chatgpt-auth';
export class ApiError extends Error { constructor(message: string, public status = 400) { super(message); } }
export async function actor() {
  const user = await getChatGPTUser();
  if (!user) throw new ApiError('Inicia sesión en tu espacio privado para guardar cambios.', 401);
  return user.userId;
}
export async function payload(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) throw new ApiError('Esta solicitud no proviene de tu espacio.', 403);
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new ApiError('Se requiere un cuerpo JSON.', 415);
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError('Faltan datos.');
  let length = 0; let value = ''; const decoder = new TextDecoder();
  while (true) { const chunk = await reader.read(); if (chunk.done) break; length += chunk.value.length; if (length > 8192) { await reader.cancel(); throw new ApiError('La solicitud es demasiado grande.', 413); } value += decoder.decode(chunk.value, { stream: true }); }
  value += decoder.decode();
  try { return JSON.parse(value); } catch { throw new ApiError('El JSON no es válido.'); }
}
export function json(data: unknown, status = 200) { return Response.json(data, { status, headers: { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } }); }
export function failure(error: unknown) {
  if (error instanceof ApiError) return json({ error: error.message }, error.status);
  console.error('brizoa_request_failed', error instanceof Error ? error.message : 'unknown');
  return json({ error: 'No pudimos acceder a tu lista. Tu cambio no se ha confirmado; vuelve a intentarlo.' }, 503);
}
