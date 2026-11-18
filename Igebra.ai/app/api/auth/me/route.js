import { getSession, sessionCookieName } from '../../../../lib/auth-store';

export const runtime = 'nodejs';

export async function GET(request) {
  const user = getSession(request.cookies.get(sessionCookieName)?.value);
  if (!user) return Response.json({ error: 'Not signed in.' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
  return Response.json({ user }, { headers: { 'Cache-Control': 'no-store' } });
}
