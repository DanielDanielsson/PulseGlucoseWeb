import { describe, expect, test } from 'vitest';
import {
  buildPresetWindow,
  getHistoryCustomKey,
  getHistoryRangeKey,
  pickBestLoadedSourceKey,
  sliceHistoryResponseToWindow,
  type HistorySelection
} from '@/lib/glucose/history-cache';
import type { GlucoseApiResponse } from '@/lib/glucose/types';

function response(from: string, to: string): GlucoseApiResponse {
  return {
    items: [
      { timestamp: from, valueMmolL: 5.1, source: 'official' },
      { timestamp: '2026-03-06T12:00:00.000Z', valueMmolL: 5.4, source: 'share' },
      { timestamp: to, valueMmolL: 5.8, source: 'official' }
    ],
    latest: {
      timestamp: to,
      valueMmolL: 5.8,
      valueMgDl: 104,
      trend: 'flat',
      source: 'official'
    },
    meta: {
      from,
      to,
      officialCount: 2,
      shareCount: 1,
      mergedCount: 3
    }
  };
}

describe('glucose history cache helpers', () => {
  test('prefers a loaded superset preset range for smaller preset selections', () => {
    const cache = new Map<string, { data?: GlucoseApiResponse }>([
      [getHistoryRangeKey('14d'), { data: response('2026-02-21T12:00:00.000Z', '2026-03-07T12:00:00.000Z') }],
      [getHistoryRangeKey('24h'), { data: response('2026-03-06T12:00:00.000Z', '2026-03-07T11:00:00.000Z') }]
    ]);

    const selection: HistorySelection = { kind: 'preset', range: '24h' };

    expect(pickBestLoadedSourceKey(cache, selection)).toBe(getHistoryRangeKey('14d'));
  });

  test('uses a loaded preset range to satisfy a custom range inside it', () => {
    const cache = new Map<string, { data?: GlucoseApiResponse }>([
      [getHistoryRangeKey('14d'), { data: response('2026-02-21T12:00:00.000Z', '2026-03-07T12:00:00.000Z') }]
    ]);

    const selection: HistorySelection = {
      kind: 'custom',
      window: {
        from: '2026-03-05T00:00:00.000Z',
        to: '2026-03-06T23:59:59.999Z'
      }
    };

    expect(pickBestLoadedSourceKey(cache, selection)).toBe(getHistoryRangeKey('14d'));
  });

  test('slices a response down to the requested target window', () => {
    const sliced = sliceHistoryResponseToWindow(
      response('2026-03-06T00:00:00.000Z', '2026-03-07T00:00:00.000Z'),
      {
        from: '2026-03-06T06:00:00.000Z',
        to: '2026-03-06T18:00:00.000Z'
      }
    );

    expect(sliced.items).toHaveLength(1);
    expect(sliced.items[0].timestamp).toBe('2026-03-06T12:00:00.000Z');
    expect(sliced.meta.officialCount).toBe(0);
    expect(sliced.meta.shareCount).toBe(1);
  });

  test('buildPresetWindow uses the requested preset duration ending at the provided timestamp', () => {
    expect(buildPresetWindow('2026-03-07T12:00:00.000Z', '24h')).toEqual({
      from: '2026-03-06T12:00:00.000Z',
      to: '2026-03-07T12:00:00.000Z'
    });
  });

  test('builds a stable custom history key', () => {
    expect(
      getHistoryCustomKey({
        from: '2026-03-05T00:00:00.000Z',
        to: '2026-03-06T23:59:59.999Z'
      })
    ).toContain('from=2026-03-05T00%3A00%3A00.000Z');
  });
});
