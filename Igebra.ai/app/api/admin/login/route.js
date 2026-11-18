import { createHmac, timingSafeEqual } from 'node:crypto';

export const runtime = 'nodejs';
const failures = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

function safeEqual(provided, expected) {
  if (typeof provided !== 'string' || typeof expected !== 'string') return false;
  const a = Buffer.from(provided); const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request) {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!username || !password || !secret) return Response.json({ error: 'Admin access is not configured on this server.' }, { status: 503 });
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return Response.json({ error: 'Request origin is not allowed.' }, { status: 403 });
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  const now = Date.now();
  const recentFailures = (failures.get(ip) || []).filter(timestamp => now - timestamp < WINDOW_MS);
  if (recentFailures.length >= MAX_FAILURES) return Response.json({ error: 'Too many sign-in attempts. Try again in 15 minutes.' }, { status: 429, headers: { 'Retry-After': '900' } });
  let input;
  try { input = await request.json(); } catch { return Response.json({ error: 'Enter a valid username and password.' }, { status: 400 }); }
  if (typeof input?.username !== 'string' || typeof input?.password !== 'string' || input.username.length > 200 || input.password.length > 200) return Response.json({ error: 'Incorrect username or password.' }, { status: 401 });
  if (!safeEqual(input.username, username) || !safeEqual(input.password, password)) {
    recentFailures.push(now); failures.set(ip, recentFailures);
    return Response.json({ error: 'Incorrect username or password.' }, { status: 401 });
  }
  failures.delete(ip);
  const payload = Buffer.from(JSON.stringify({ expires: Date.now() + 8 * 60 * 60 * 1000 })).toString('base64url');
  const signature = createHmac('sha256', secret).update(payload).digest('base64url');
  const response = Response.json({ ok: true });
  response.headers.set('Set-Cookie', `gapfinder_admin=${payload}.${signature}; HttpOnly; SameSite=Lax; Path=/api/admin; Max-Age=28800${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
  return response;
}
