import { clearSessionCookie, revokeSession, sessionCookieName } from '../../../../lib/auth-store';

export const runtime = 'nodejs';

export async function POST(request) {
  if (request.headers.get('origin') && request.headers.get('origin') !== new URL(request.url).origin) return Response.json({ error: 'Request origin is not allowed.' }, { status: 403 });
  revokeSession(request.cookies.get(sessionCookieName)?.value);
  const response = Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  response.headers.set('Set-Cookie', clearSessionCookie());
  return response;
}
