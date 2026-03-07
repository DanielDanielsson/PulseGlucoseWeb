'use client';

import { useCallback, useEffect, useState } from 'react';
import { GlucoseChart, type ChartPoint } from './glucose-chart';

interface LatestReading {
  valueMmolL: number;
  valueMgDl: number;
  trend: string;
  timestamp: string;
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

type TimeRange = '6h' | '12h' | '24h' | '3d' | '7d';

const TIME_RANGES: { key: TimeRange; label: string; hours: number }[] = [
  { key: '6h', label: '6h', hours: 6 },
  { key: '12h', label: '12h', hours: 12 },
  { key: '24h', label: '24h', hours: 24 },
  { key: '3d', label: '3 days', hours: 72 },
  { key: '7d', label: '7 days', hours: 168 }
];

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

  for (const p of items) {
    sum += p.valueMmolL;
    if (p.valueMmolL < min) min = p.valueMmolL;
    if (p.valueMmolL > max) max = p.valueMmolL;
    if (p.valueMmolL < 4.0) low++;
    else if (p.valueMmolL > 10.0) high++;
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
  const [data, setData] = useState<ChartPoint[]>([]);
  const [latest, setLatest] = useState<LatestReading | null>(null);
  const [meta, setMeta] = useState<GlucoseApiResponse['meta'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<TimeRange>('24h');

  const fetchData = useCallback(async (timeRange: TimeRange) => {
    setLoading(true);
    setError(null);

    const hours = TIME_RANGES.find((r) => r.key === timeRange)?.hours || 24;
    const now = new Date();
    const from = new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();
    const to = now.toISOString();
    const limit = Math.min(hours * 12 + 100, 5000);

    try {
      const response = await fetch(
        `/api/dashboard/glucose/history?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&limit=${limit}`
      );

      const json = (await response.json()) as GlucoseApiResponse;

      if (!response.ok) {
        throw new Error(json.error?.message || 'Failed to load glucose data');
      }

      setData(json.items);
      setLatest(json.latest);
      setMeta(json.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load glucose data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(range);
  }, [range, fetchData]);

  useEffect(() => {
    const interval = setInterval(() => fetchData(range), 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [range, fetchData]);

  const stats = computeStats(data);

  // Expose latest reading for the dashboard layout to pick up
  useEffect(() => {
    if (latest) {
      window.dispatchEvent(new CustomEvent('pulse-glucose-latest', { detail: latest }));
    }
  }, [latest]);

  const [chartHeight, setChartHeight] = useState(560);

  useEffect(() => {
    setChartHeight(Math.max(500, window.innerHeight * 0.58));
  }, []);

  return (
    <div className="glucose-analysis-fullwidth">
      {/* Chart panel — breaks out of dashboard container for full width */}
      <section className="panel" style={{
        borderRadius: 'var(--radius-2xl)',
        overflow: 'hidden',
        padding: 0
      }}>
        {/* Toolbar */}
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
            {TIME_RANGES.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => setRange(r.key)}
                className={range === r.key ? 'button-primary' : 'button-ghost'}
                style={{ minHeight: '2rem', padding: '0 0.75rem', fontSize: '0.78rem' }}
              >
                {r.label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {meta && !loading && (
              <span style={{ fontSize: 11, color: 'var(--text-soft)' }}>
                {meta.mergedCount} readings ({meta.officialCount} official + {meta.shareCount} share)
              </span>
            )}
            <span style={{ fontSize: 11, color: 'var(--text-soft)' }}>
              Drag to pan · Ctrl+scroll to zoom
            </span>
          </div>
        </div>

        {/* Chart area */}
        <div style={{ position: 'relative', minHeight: chartHeight }}>
          {loading && (
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

          {error && !loading && (
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
              <p style={{ fontSize: 13, color: '#fb7185' }}>{error}</p>
              <button
                type="button"
                onClick={() => fetchData(range)}
                className="button-secondary"
                style={{ minHeight: '2.25rem', fontSize: '0.82rem' }}
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && data.length === 0 && (
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

          {!error && data.length > 0 && (
            <div style={{ opacity: loading ? 0.3 : 1, transition: 'opacity 200ms ease' }}>
              <GlucoseChart data={data} height={chartHeight} />
            </div>
          )}
        </div>

        {/* Stats bar below chart */}
        {!loading && data.length > 0 && (
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
          </div>
        )}
      </section>
    </div>
  );
}
