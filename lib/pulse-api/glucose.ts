import type { PulseApiReading } from '@/lib/pulse-api/types';

export interface GlucoseHistoryResponse {
  items: PulseApiReading[];
  meta: {
    from: string;
    to: string;
    limit: number;
    returned: number;
  };
}

export interface MergedGlucosePoint {
  timestamp: string;
  valueMmolL: number;
  valueMgDl: number;
  trend: string;
  source: 'official' | 'share';
}

function getReadingMinuteKey(timestamp: string): number {
  return Math.floor(new Date(timestamp).getTime() / 60_000);
}

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable ${name}`);
  }

  return value;
}

function resolveUrl(path: string): string {
  return new URL(path, getRequiredEnv('PULSE_API_BASE_URL')).toString();
}

function createHeaders(): Headers {
  const headers = new Headers();
  const consumerKey = process.env.PULSE_API_CONSUMER_KEY?.trim();
  const token = consumerKey || getRequiredEnv('PULSE_API_ADMIN_TOKEN');
  headers.set('Authorization', `Bearer ${token}`);
  return headers;
}

export async function fetchGlucoseHistory(
  source: 'official' | 'share',
  from: string,
  to: string,
  limit = 2000
): Promise<GlucoseHistoryResponse> {
  const basePath =
    source === 'official' ? '/api/v1/glucose/history' : '/api/v1/share/glucose/history';

  const url = new URL(resolveUrl(basePath));
  url.searchParams.set('from', from);
  url.searchParams.set('to', to);
  url.searchParams.set('limit', String(limit));

  const response = await fetch(url.toString(), {
    headers: createHeaders(),
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(`Glucose history (${source}) failed with status ${response.status}`);
  }

  return response.json() as Promise<GlucoseHistoryResponse>;
}

export async function fetchGlucoseLatest(
  source: 'official' | 'share'
): Promise<PulseApiReading | null> {
  const basePath =
    source === 'official' ? '/api/v1/glucose/latest' : '/api/v1/share/glucose/latest';

  const response = await fetch(resolveUrl(basePath), {
    headers: createHeaders(),
    cache: 'no-store'
  });

  if (!response.ok) {
    return null;
  }

  return response.json() as Promise<PulseApiReading>;
}

export function pickLatestGlucoseReading(
  official: PulseApiReading | null,
  share: PulseApiReading | null
): PulseApiReading | null {
  if (!official) return share;
  if (!share) return official;

  const officialKey = getReadingMinuteKey(official.timestamp);
  const shareKey = getReadingMinuteKey(share.timestamp);

  if (officialKey === shareKey) {
    return official;
  }

  return officialKey > shareKey ? official : share;
}

/**
 * Merges official and share glucose readings into a single timeline.
 * Official readings are preferred. Share readings fill in the recent gap
 * where official data hasn't arrived yet (~3h delay).
 */
export function mergeGlucoseReadings(
  official: PulseApiReading[],
  share: PulseApiReading[]
): MergedGlucosePoint[] {
  const pointMap = new Map<number, MergedGlucosePoint>();

  for (const reading of official) {
    const key = getReadingMinuteKey(reading.timestamp);
    pointMap.set(key, {
      timestamp: reading.timestamp,
      valueMmolL: reading.valueMmolL,
      valueMgDl: reading.valueMgDl,
      trend: reading.trend,
      source: 'official'
    });
  }

  for (const reading of share) {
    const key = getReadingMinuteKey(reading.timestamp);
    if (!pointMap.has(key)) {
      pointMap.set(key, {
        timestamp: reading.timestamp,
        valueMmolL: reading.valueMmolL,
        valueMgDl: reading.valueMgDl,
        trend: reading.trend,
        source: 'share'
      });
    }
  }

  return Array.from(pointMap.values()).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}
