'use client';

import { useEffect, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { GlucoseChart } from './glucose-chart';
import { GlucoseAgpChart } from './glucose-agp-chart';
import { GlucoseDateRangePicker } from './glucose-date-range-picker';
import { GlucoseStatRing } from './glucose-stat-ring';
import {
  buildPresetWindow,
  getHistoryCustomKey,
  getHistoryRangeKey,
  pickBestLoadedSourceKey,
  sliceHistoryResponseToWindow,
  type HistorySelection,
  type HistoryWindow
} from '@/lib/glucose/history-cache';
import { computeGlucoseStats } from '@/lib/glucose/metrics';
import { GLUCOSE_TIME_RANGES } from '@/lib/glucose/time-ranges';
import type { GlucoseApiResponse, GlucoseUpdatesResponse } from '@/lib/glucose/types';

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const json = (await response.json()) as T & { error?: { message?: string } };

  if (!response.ok) {
    throw new Error(json.error?.message || 'Request failed');
  }

  return json;
}

function getUpdatesKey(timestamp: string): string {
  return `/api/dashboard/glucose/updates?since=${encodeURIComponent(timestamp)}`;
}

function StatValue({
  label,
  value,
  color,
  prominent = false
}: {
  label: string;
  value: string;
  color?: string;
  prominent?: boolean;
}) {
  return (
    <div style={{ display: 'grid', gap: 4, alignContent: 'start' }}>
      <span style={{ fontSize: 11, color: 'var(--text-soft)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>
        {label}
      </span>
      <span style={{
        fontSize: prominent ? 22 : 16,
        fontWeight: 700,
        fontFamily: 'var(--font-plex-mono), monospace',
        color: color || 'var(--text)'
      }}>
        {value}
      </span>
    </div>
  );
}

function getSelectionTargetWindow(
  selection: HistorySelection,
  sourceData: GlucoseApiResponse | undefined
): HistoryWindow | null {
  if (selection.kind === 'custom') {
    return selection.window;
  }

  if (!sourceData) {
    return null;
  }

  return buildPresetWindow(sourceData.meta.to, selection.range);
}

export function GlucoseAnalysisView() {
  const [selection, setSelection] = useState<HistorySelection>({
    kind: 'preset',
    range: '24h'
  });
  const [chartHeight, setChartHeight] = useState(560);
  const [chartYMaxInput, setChartYMaxInput] = useState('25');
  const [isApplyingUpdates, setIsApplyingUpdates] = useState(false);
  const { cache, mutate: globalMutate } = useSWRConfig();

  const loadedSourceKey = pickBestLoadedSourceKey(cache, selection);
  const requestKey =
    selection.kind === 'preset'
      ? getHistoryRangeKey(selection.range)
      : getHistoryCustomKey(selection.window);
  const sourceKey = loadedSourceKey ?? requestKey;

  const {
    data: sourceData,
    error,
    isLoading,
    isValidating,
    mutate
  } = useSWR<GlucoseApiResponse>(sourceKey, fetchJson, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false
  });

  const targetWindow = getSelectionTargetWindow(selection, sourceData);
  const data = sourceData && targetWindow
    ? sliceHistoryResponseToWindow(sourceData, targetWindow)
    : sourceData;

  const displayedLatestTimestamp = selection.kind === 'preset' ? data?.latest?.timestamp ?? null : null;
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

  const stats = computeGlucoseStats(data?.items ?? []);
  const newReadingsCount = updates?.meta.newCount ?? 0;
  const showLoadingOverlay = !data && isLoading;
  const parsedChartYMax = Number(chartYMaxInput);
  const chartYMax = Number.isFinite(parsedChartYMax) ? Math.max(12, parsedChartYMax) : 25;

  async function applyUpdates() {
    setIsApplyingUpdates(true);
    try {
      await globalMutate(sourceKey);
    } finally {
      setIsApplyingUpdates(false);
    }
  }

  const activePreset = selection.kind === 'preset' ? selection.range : null;
  const customValue = selection.kind === 'custom' ? selection.window : null;

  return (
    <div className="glucose-analysis-fullwidth">
      <section
        className="panel"
        style={{
          position: 'sticky',
          top: '4.75rem',
          zIndex: 30,
          borderRadius: 'var(--radius-2xl)',
          padding: '1rem 1.25rem',
          display: 'grid',
          gap: '1rem'
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.9rem 1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem 1rem', flexWrap: 'wrap', flex: '1 1 620px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
              {GLUCOSE_TIME_RANGES.map((timeRange) => (
                <button
                  key={timeRange.key}
                  type="button"
                  onClick={() => setSelection({ kind: 'preset', range: timeRange.key })}
                  className={activePreset === timeRange.key ? 'button-primary' : 'button-ghost'}
                  style={{ minHeight: '2rem', padding: '0 0.75rem', fontSize: '0.78rem' }}
                >
                  {timeRange.label}
                </button>
              ))}
              <GlucoseDateRangePicker
                value={customValue}
                onApply={(window) => {
                  setSelection({ kind: 'custom', window });
                }}
              />
              {newReadingsCount > 0 && (
                <button
                  type="button"
                  onClick={applyUpdates}
                  className="button-primary"
                  disabled={isApplyingUpdates}
                  style={{ minHeight: '2rem', padding: '0 0.85rem', fontSize: '0.78rem', marginLeft: 6 }}
                >
                  {isApplyingUpdates
                    ? 'Loading readings...'
                  : `Load ${newReadingsCount} new reading${newReadingsCount === 1 ? '' : 's'}`}
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <label style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 11,
                color: 'var(--text-soft)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em'
              }}>
                <span>Top</span>
                <input
                  type="number"
                  min={12}
                  step={1}
                  inputMode="numeric"
                  value={chartYMaxInput}
                  onChange={(event) => setChartYMaxInput(event.target.value)}
                  style={{
                    width: 72,
                    minHeight: '2rem',
                    padding: '0 0.65rem',
                    borderRadius: '999px',
                    border: '1px solid var(--border-strong)',
                    background: 'var(--surface)',
                    color: 'var(--text)',
                    fontSize: 13,
                    fontFamily: 'var(--font-plex-mono), monospace'
                  }}
                  aria-label="Chart top value in mmol/L"
                />
              </label>
              {data && !showLoadingOverlay && (
                <span style={{ fontSize: 11, color: 'var(--text-soft)' }}>
                  {data.meta.mergedCount} readings ({data.meta.officialCount} official + {data.meta.shareCount} share)
                </span>
              )}
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            flexWrap: 'wrap',
            gap: '0.9rem 1.25rem'
          }}>
            {!showLoadingOverlay && !error && data && data.items.length > 0 && (
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginRight: '0.5rem', alignItems: 'flex-end' }}>
                <StatValue label="Avg" value={stats.avg.toFixed(1)} prominent />
                <StatValue label="Min" value={stats.min.toFixed(1)} color={stats.min < 4 ? '#fb7185' : undefined} />
                <StatValue label="Max" value={stats.max.toFixed(1)} color={stats.max > 10 ? '#fbbf24' : undefined} />
                {updatesError && <StatValue label="Updates" value="poll failed" color="#fb7185" />}
              </div>
            )}

            {!showLoadingOverlay && !error && data && data.items.length > 0 && (
              <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <GlucoseStatRing label="Very low" percentage={stats.veryLow.percentage} color="#e11d48" />
                <GlucoseStatRing label="Low" percentage={stats.low.percentage} color="#fb7185" />
                <GlucoseStatRing label="In range" percentage={stats.inRange.percentage} color="#34d399" />
                <GlucoseStatRing label="High" percentage={stats.high.percentage} color="#fbbf24" />
                <GlucoseStatRing label="Very high" percentage={stats.veryHigh.percentage} color="#f97316" />
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="panel" style={{
        marginTop: '1rem',
        borderRadius: 'var(--radius-2xl)',
        overflow: 'hidden',
        padding: 0
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          padding: '0.75rem 1rem 0',
          fontSize: 11,
          color: 'var(--text-soft)'
        }}>
          <span>Drag to pan · Ctrl or Cmd + scroll to zoom</span>
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
              <GlucoseChart data={data.items} height={chartHeight} yMax={chartYMax} />
            </div>
          )}
        </div>
      </section>

      {!showLoadingOverlay && !error && data && data.items.length > 0 && (
        <section className="panel" style={{ marginTop: '1rem', borderRadius: 'var(--radius-2xl)', overflow: 'hidden' }}>
          <GlucoseAgpChart data={data.items} height={chartHeight} yMax={chartYMax} />
        </section>
      )}
    </div>
  );
}
