import { createHmac, timingSafeEqual } from 'node:crypto';

export const runtime = 'nodejs';
const cookieName = 'gapfinder_admin';

function validSession(request) {
  const token = request.cookies.get(cookieName)?.value;
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!token || !secret) return false;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return false;
  const expected = createHmac('sha256', secret).update(payload).digest('base64url');
  const a = Buffer.from(signature); const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  try { return JSON.parse(Buffer.from(payload, 'base64url').toString()).expires > Date.now(); } catch { return false; }
}

export async function GET(request) {
  return Response.json({ isAdmin: validSession(request) });
}

export async function DELETE() {
  const response = Response.json({ ok: true });
  response.headers.set('Set-Cookie', `${cookieName}=; HttpOnly; SameSite=Lax; Path=/api/admin; Max-Age=0${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
  return response;
}
