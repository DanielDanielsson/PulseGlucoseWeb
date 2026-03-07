import { NextRequest, NextResponse } from 'next/server';
import { getOwnerSession } from '@/lib/auth';
import { PulseApiClientError, createApiKey, revokeApiKey } from '@/lib/pulse-api/client';

export async function POST(request: NextRequest) {
  const session = await getOwnerSession();
  if (!session) {
    return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
  }

  const payload = (await request.json()) as { id?: string; name?: string };

  try {
    const created = await createApiKey(payload.name || '');
    let warning: string | undefined;

    try {
      await revokeApiKey(payload.id || '');
    } catch (error) {
      warning = error instanceof Error ? `New key created but old key delete failed: ${error.message}` : 'New key created but old key delete failed';
    }

    return NextResponse.json({ ...created, warning }, { status: 200 });
  } catch (error) {
    const status = error instanceof PulseApiClientError ? error.status : 502;
    return NextResponse.json(
      { error: { message: error instanceof Error ? error.message : 'Failed to regenerate API key' } },
      { status }
    );
  }
}
