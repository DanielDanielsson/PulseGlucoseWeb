import { NextRequest, NextResponse } from 'next/server';
import { getOwnerSession } from '@/lib/auth';
import {
  fetchGlucoseHistory,
  fetchGlucoseLatest,
  mergeGlucoseReadings
} from '@/lib/pulse-api/glucose';
import type { PulseApiReading } from '@/lib/pulse-api/types';

const API_MAX_LIMIT = 1000;
const CHUNK_MS = 2.5 * 24 * 60 * 60 * 1000; // 2.5 days per chunk

/**
 * Splits a time range into chunks small enough that each stays under the
 * API's max limit (~1000 readings = ~3.5 days at 5-min intervals).
 * Fetches all chunks in parallel and concatenates the results.
 */
async function fetchOfficialChunked(from: string, to: string): Promise<PulseApiReading[]> {
  const fromMs = new Date(from).getTime();
  const toMs = new Date(to).getTime();
  const rangeMs = toMs - fromMs;

  if (rangeMs <= CHUNK_MS) {
    const result = await fetchGlucoseHistory('official', from, to, API_MAX_LIMIT);
    return result.items;
  }

  const chunks: { from: string; to: string }[] = [];
  let cursor = fromMs;
  while (cursor < toMs) {
    const chunkEnd = Math.min(cursor + CHUNK_MS, toMs);
    chunks.push({
      from: new Date(cursor).toISOString(),
      to: new Date(chunkEnd).toISOString()
    });
    cursor = chunkEnd;
  }

  const results = await Promise.all(
    chunks.map((c) =>
      fetchGlucoseHistory('official', c.from, c.to, API_MAX_LIMIT)
        .then((r) => r.items)
        .catch(() => [] as PulseApiReading[])
    )
  );

  return results.flat();
}

export async function GET(request: NextRequest) {
  const session = await getOwnerSession();
  if (!session) {
    return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const now = new Date();
  const defaultFrom = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const from = params.get('from') || defaultFrom;
  const to = params.get('to') || now.toISOString();

  try {
    const shareWindowStart = new Date(
      Math.max(new Date(from).getTime(), now.getTime() - 4 * 60 * 60 * 1000)
    ).toISOString();

    const [officialItems, share, latestShare] = await Promise.all([
      fetchOfficialChunked(from, to).catch(() => [] as PulseApiReading[]),
      fetchGlucoseHistory('share', shareWindowStart, to, 500).catch(() => ({ items: [] as PulseApiReading[] })),
      fetchGlucoseLatest('share').catch(() => null)
    ]);

    const merged = mergeGlucoseReadings(officialItems, share.items);

    return NextResponse.json({
      items: merged,
      latest: latestShare,
      meta: {
        from,
        to,
        officialCount: officialItems.length,
        shareCount: share.items.length,
        mergedCount: merged.length
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: { message: error instanceof Error ? error.message : 'Failed to load glucose data' } },
      { status: 502 }
    );
  }
}
