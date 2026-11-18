import { createAccount, issueSession, sessionCookie } from '../../../../lib/auth-store';

export const runtime = 'nodejs';

export async function POST(request) {
  if (request.headers.get('origin') && request.headers.get('origin') !== new URL(request.url).origin) return Response.json({ error: 'Request origin is not allowed.' }, { status: 403 });
  let input;
  try { input = await request.json(); } catch { return Response.json({ error: 'Enter valid account details.' }, { status: 400 }); }
  const name = typeof input?.name === 'string' ? input.name.trim() : '';
  const email = typeof input?.email === 'string' ? input.email.trim().toLowerCase() : '';
  const password = typeof input?.password === 'string' ? input.password : '';
  if (name.length < 2 || name.length > 80) return Response.json({ error: 'Name must be between 2 and 80 characters.' }, { status: 400 });
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({ error: 'Enter a valid email address.' }, { status: 400 });
  if (password.length < 12 || password.length > 256) return Response.json({ error: 'Use a password between 12 and 256 characters.' }, { status: 400 });
  try {
    const user = await createAccount({ name, email, password });
    if (!user) return Response.json({ error: 'An account with this email already exists. Try signing in.' }, { status: 409 });
    const session = issueSession(user.id);
    const response = Response.json({ user }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
    response.headers.set('Set-Cookie', sessionCookie(session.token));
    return response;
  } catch {
    return Response.json({ error: 'Could not create the account. Please try again.' }, { status: 500 });
  }
}
