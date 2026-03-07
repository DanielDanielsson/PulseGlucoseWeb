import { afterEach, describe, expect, test, vi } from 'vitest';

describe('pulse api client', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  test('sends status token when configured', async () => {
    vi.stubEnv('PULSE_API_BASE_URL', 'https://example.com');
    vi.stubEnv('PULSE_API_STATUS_TOKEN', 'status-token');
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_input: string | URL, init?: RequestInit) => {
        expect(init?.headers).toBeInstanceOf(Headers);
        const headers = init?.headers as Headers;
        expect(headers.get('x-status-token')).toBe('status-token');

        return new Response(
          JSON.stringify({
            generatedAt: '2026-03-06T10:00:00.000Z',
            official: { stable: true, connected: true, latestReading: null, sourceToDbLagMinutes: null, latestReadingAgeMinutes: null },
            share: { stable: true, connected: true, latestReading: null, sourceToDbLagMinutes: null, latestReadingAgeMinutes: null }
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );

    const { fetchApiStatus } = await import('@/lib/pulse-api/client');
    const report = await fetchApiStatus();

    expect(report.official.stable).toBe(true);
  });
});
