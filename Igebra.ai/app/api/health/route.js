import { pingDatabase } from '../../../lib/auth-store';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (!pingDatabase()) throw new Error('Database health check failed');
    return Response.json({ status: 'ok', service: 'gapfinder-web', database: 'ok' }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ status: 'degraded', service: 'gapfinder-web', database: 'unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
