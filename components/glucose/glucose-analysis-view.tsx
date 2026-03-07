'use client';

import { useEffect, useState } from 'react';
import useSWR, { useSWRConfig, type State as SWRState } from 'swr';
import { GlucoseChart, type ChartPoint } from './glucose-chart';
import { GLUCOSE_TIME_RANGES, getTimeRangeHours, type TimeRange } from '@/lib/glucose/time-ranges';

interface LatestReading {
  valueMmolL: number;
  valueMgDl: number;
  trend: string;
  timestamp: string;
  source: 'official' | 'share';
}

interface GlucoseApiResponse {
  items: ChartPoint[];
  latest: LatestReading | null;
  meta: {
    from: string;
    to: string;
    officialCount: number;
    shareCount: number;
    mergedCount: number;
  };
  error?: { message: string };
}

interface GlucoseUpdatesResponse {
  latest: LatestReading | null;
  meta: {
    since: string;
    to: string;
    newCount: number;
  };
  error?: { message: string };
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const json = (await response.json()) as T & { error?: { message?: string } };

  if (!response.ok) {
    throw new Error(json.error?.message || 'Request failed');
  }

  return json;
}

function getHistoryKey(range: TimeRange): string {
  return `/api/dashboard/glucose/history?range=${range}`;
}

function getUpdatesKey(timestamp: string): string {
  return `/api/dashboard/glucose/updates?since=${encodeURIComponent(timestamp)}`;
}

function getResponseFreshness(response: GlucoseApiResponse): number {
  return new Date(response.latest?.timestamp ?? response.meta.to).getTime();
}

function getCachedHistoryData(
  cache: ReturnType<typeof useSWRConfig>['cache'],
  range: TimeRange
): GlucoseApiResponse | undefined {
  const state = cache.get(getHistoryKey(range)) as SWRState<GlucoseApiResponse> | undefined;
  return state?.data;
}

function pickBestLoadedSourceRange(
  cache: ReturnType<typeof useSWRConfig>['cache'],
  targetRange: TimeRange
): TimeRange | null {
  const targetHours = getTimeRangeHours(targetRange);
  if (!targetHours) {
    return null;
  }

  let bestMatch: { key: TimeRange; hours: number; freshness: number } | null = null;

  for (const timeRange of GLUCOSE_TIME_RANGES) {
    if (timeRange.hours < targetHours) {
      continue;
    }

    const data = getCachedHistoryData(cache, timeRange.key);
    if (!data) {
      continue;
    }

    const candidate = {
      key: timeRange.key,
      hours: timeRange.hours,
      freshness: getResponseFreshness(data)
    };

    if (
      !bestMatch ||
      candidate.freshness > bestMatch.freshness ||
      (candidate.freshness === bestMatch.freshness && candidate.hours > bestMatch.hours)
    ) {
      bestMatch = candidate;
    }
  }

  return bestMatch?.key ?? null;
}

function buildVisibleRangeData(sourceData: GlucoseApiResponse, targetRange: TimeRange): GlucoseApiResponse {
  const targetHours = getTimeRangeHours(targetRange);
  if (!targetHours) {
    return sourceData;
  }

  const rangeMs = targetHours * 60 * 60 * 1000;
  const endMs = getResponseFreshness(sourceData);
  const cutoffMs = endMs - rangeMs;
  const items = sourceData.items.filter((item) => new Date(item.timestamp).getTime() >= cutoffMs);
  const officialCount = items.filter((item) => item.source === 'official').length;
  const shareCount = items.length - officialCount;

  return {
    ...sourceData,
    items,
    meta: {
      from: new Date(cutoffMs).toISOString(),
      to: new Date(endMs).toISOString(),
      officialCount,
      shareCount,
      mergedCount: items.length
    }
  };
}

function computeStats(items: ChartPoint[]) {
  if (items.length === 0) {
    return { avg: 0, min: 0, max: 0, inRange: 0, low: 0, high: 0 };
  }

  let sum = 0;
  let min = Infinity;
  let max = -Infinity;
  let inRange = 0;
  let low = 0;
  let high = 0;

  for (const point of items) {
    sum += point.valueMmolL;
    if (point.valueMmolL < min) min = point.valueMmolL;
    if (point.valueMmolL > max) max = point.valueMmolL;
    if (point.valueMmolL < 4.0) low++;
    else if (point.valueMmolL > 10.0) high++;
    else inRange++;
  }

  return {
    avg: sum / items.length,
    min,
    max,
    inRange: Math.round((inRange / items.length) * 100),
    low: Math.round((low / items.length) * 100),
    high: Math.round((high / items.length) * 100)
  };
}

function StatItem({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4 }}>
      <span style={{ fontSize: 11, color: 'var(--text-soft)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>
        {label}
      </span>
      <span style={{
        fontSize: 13,
        fontWeight: 700,
        fontFamily: 'var(--font-plex-mono), monospace',
        color: color || 'var(--text)'
      }}>
        {value}
      </span>
    </span>
  );
}

export function GlucoseAnalysisView() {
  const [range, setRange] = useState<TimeRange>('24h');
  const [chartHeight, setChartHeight] = useState(560);
  const [isApplyingUpdates, setIsApplyingUpdates] = useState(false);
  const { cache, mutate: globalMutate } = useSWRConfig();

  const loadedSourceRange = pickBestLoadedSourceRange(cache, range);
  const sourceRange = loadedSourceRange ?? range;
  const historyKey = getHistoryKey(sourceRange);
  const {
    data: sourceData,
    error,
    isLoading,
    isValidating,
    mutate
  } = useSWR<GlucoseApiResponse>(historyKey, fetchJson, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false
  });
  const data = sourceData ? buildVisibleRangeData(sourceData, range) : undefined;

  const displayedLatestTimestamp = data?.latest?.timestamp ?? null;
  const {
    data: updates,
    error: updatesError
  } = useSWR<GlucoseUpdatesResponse>(
    displayedLatestTimestamp ? getUpdatesKey(displayedLatestTimestamp) : null,
    fetchJson,
    {
      refreshInterval: 2 * 60 * 1000,
      revalidateOnFocus: false,
      revalidateOnReconnect: false
    }
  );

  useEffect(() => {
    setChartHeight(Math.max(500, window.innerHeight * 0.58));
  }, []);

  useEffect(() => {
    if (data?.latest) {
      window.dispatchEvent(new CustomEvent('pulse-glucose-latest', { detail: data.latest }));
    }
  }, [data?.latest]);

  const stats = computeStats(data?.items ?? []);
  const newReadingsCount = updates?.meta.newCount ?? 0;
  const showLoadingOverlay = !data && isLoading;

  async function applyUpdates() {
    setIsApplyingUpdates(true);
    try {
      await globalMutate(historyKey);
    } finally {
      setIsApplyingUpdates(false);
    }
  }

  return (
    <div className="glucose-analysis-fullwidth">
      <section className="panel" style={{
        borderRadius: 'var(--radius-2xl)',
        overflow: 'hidden',
        padding: 0
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.625rem 1.25rem',
          borderBottom: '1px solid var(--border)',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <span style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--accent)',
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              marginRight: 8
            }}>
              Timeline
            </span>
            {GLUCOSE_TIME_RANGES.map((timeRange) => (
              <button
                key={timeRange.key}
                type="button"
                onClick={() => setRange(timeRange.key)}
                className={range === timeRange.key ? 'button-primary' : 'button-ghost'}
                style={{ minHeight: '2rem', padding: '0 0.75rem', fontSize: '0.78rem' }}
              >
                {timeRange.label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {newReadingsCount > 0 && (
              <button
                type="button"
                onClick={applyUpdates}
                className="button-primary"
                disabled={isApplyingUpdates}
                style={{ minHeight: '2rem', padding: '0 0.85rem', fontSize: '0.78rem' }}
              >
                {isApplyingUpdates
                  ? 'Loading readings...'
                  : `Load ${newReadingsCount} new reading${newReadingsCount === 1 ? '' : 's'}`}
              </button>
            )}
            {data && !showLoadingOverlay && (
              <span style={{ fontSize: 11, color: 'var(--text-soft)' }}>
                {data.meta.mergedCount} readings ({data.meta.officialCount} official + {data.meta.shareCount} share)
              </span>
            )}
            <span style={{ fontSize: 11, color: 'var(--text-soft)' }}>
              Drag to pan · Ctrl or Cmd + scroll to zoom
            </span>
          </div>
        </div>

        <div style={{ position: 'relative', minHeight: chartHeight }}>
          {showLoadingOverlay && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              zIndex: 5
            }}>
              <div className="glucose-chart-skeleton" />
              <p style={{ fontSize: 13, color: 'var(--text-soft)' }}>Loading glucose data...</p>
            </div>
          )}

          {error && !showLoadingOverlay && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              zIndex: 5
            }}>
              <p style={{ fontSize: 13, color: '#fb7185' }}>{error.message}</p>
              <button
                type="button"
                onClick={() => mutate()}
                className="button-secondary"
                style={{ minHeight: '2.25rem', fontSize: '0.82rem' }}
              >
                Retry
              </button>
            </div>
          )}

          {!error && data && data.items.length === 0 && !showLoadingOverlay && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: chartHeight,
              color: 'var(--text-soft)',
              fontSize: 14
            }}>
              No glucose data available for this time range.
            </div>
          )}

          {!error && data && data.items.length > 0 && (
            <div style={{ opacity: isValidating || isApplyingUpdates ? 0.55 : 1, transition: 'opacity 200ms ease' }}>
              <GlucoseChart data={data.items} height={chartHeight} />
            </div>
          )}
        </div>

        {!showLoadingOverlay && !error && data && data.items.length > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '16px 28px',
            padding: '10px 16px',
            borderTop: '1px solid var(--border)',
            background: 'var(--surface-muted)'
          }}>
            <StatItem label="Avg" value={stats.avg.toFixed(1)} />
            <StatItem label="Min" value={stats.min.toFixed(1)} color={stats.min < 4 ? '#fb7185' : undefined} />
            <StatItem label="Max" value={stats.max.toFixed(1)} color={stats.max > 10 ? '#fbbf24' : undefined} />
            <StatItem label="In range" value={`${stats.inRange}%`} color="#34d399" />
            <StatItem label="Low" value={`${stats.low}%`} color="#fb7185" />
            <StatItem label="High" value={`${stats.high}%`} color="#fbbf24" />
            {updatesError && <StatItem label="Updates" value="poll failed" color="#fb7185" />}
          </div>
        )}
      </section>
    </div>
  );
}
