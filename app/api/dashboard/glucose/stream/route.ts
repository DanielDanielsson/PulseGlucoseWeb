import { NextResponse } from 'next/server';
import { getOwnerSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable ${name}`);
  }

  return value;
}

function resolveStreamUrl(): string {
  const url = new URL('/api/v1/stream/glucose', getRequiredEnv('PULSE_API_BASE_URL'));
  url.searchParams.set('source', 'share');
  return url.toString();
}

function createStreamHeaders(): Headers {
  const headers = new Headers();
  const consumerKey = process.env.PULSE_API_CONSUMER_KEY?.trim();
  const token = consumerKey || getRequiredEnv('PULSE_API_ADMIN_TOKEN');
  headers.set('Authorization', `Bearer ${token}`);
  headers.set('Accept', 'text/event-stream');
  return headers;
}

export async function GET(request: Request) {
  const session = await getOwnerSession();
  if (!session) {
    return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
  }

  const controller = new AbortController();
  request.signal.addEventListener('abort', () => controller.abort(), { once: true });

  try {
    const upstream = await fetch(resolveStreamUrl(), {
      method: 'GET',
      headers: createStreamHeaders(),
      cache: 'no-store',
      signal: controller.signal
    });

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json(
        { error: { message: `Glucose stream failed with status ${upstream.status}` } },
        { status: 502 }
      );
    }

    const headers = new Headers();
    headers.set('Content-Type', 'text/event-stream; charset=utf-8');
    headers.set('Cache-Control', 'no-cache, no-transform');
    headers.set('Connection', 'keep-alive');
    headers.set('X-Accel-Buffering', 'no');

    return new Response(upstream.body, {
      status: 200,
      headers
    });
  } catch (error) {
    return NextResponse.json(
      { error: { message: error instanceof Error ? error.message : 'Failed to connect glucose stream' } },
      { status: 502 }
    );
  }
}
