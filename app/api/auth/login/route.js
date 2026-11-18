import { issueSession, sessionCookie, verifyCredentials } from '../../../../lib/auth-store';

export const runtime = 'nodejs';
const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 8;

export async function POST(request) {
  if (request.headers.get('origin') && request.headers.get('origin') !== new URL(request.url).origin) return Response.json({ error: 'Request origin is not allowed.' }, { status: 403 });
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  const now = Date.now();
  const recent = (attempts.get(ip) || []).filter(time => now - time < WINDOW_MS);
  if (recent.length >= MAX_FAILURES) return Response.json({ error: 'Too many sign-in attempts. Try again in 15 minutes.' }, { status: 429, headers: { 'Retry-After': '900' } });
  let input;
  try { input = await request.json(); } catch { return Response.json({ error: 'Enter an email address and password.' }, { status: 400 }); }
  if (typeof input?.email !== 'string' || typeof input?.password !== 'string' || input.email.length > 254 || input.password.length > 256) return Response.json({ error: 'Unable to sign in with those details.' }, { status: 401 });
  try {
    const user = await verifyCredentials(input.email, input.password);
    if (!user) {
      recent.push(now); attempts.set(ip, recent);
      return Response.json({ error: 'Unable to sign in with those details.' }, { status: 401 });
    }
    attempts.delete(ip);
    const session = issueSession(user.id);
    const response = Response.json({ user }, { headers: { 'Cache-Control': 'no-store' } });
    response.headers.set('Set-Cookie', sessionCookie(session.token));
    return response;
  } catch {
    return Response.json({ error: 'Could not sign in right now. Please try again.' }, { status: 500 });
  }
}
