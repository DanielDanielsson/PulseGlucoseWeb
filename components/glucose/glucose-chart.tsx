'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import type { ChartPoint } from '@/lib/glucose/types';
import { getGlucoseColor, type GlucoseColorMode } from '@/lib/glucose/tints';

export type { ChartPoint } from '@/lib/glucose/types';

interface GlucoseChartProps {
  data: ChartPoint[];
  height?: number;
  yMax?: number;
  colorMode: GlucoseColorMode;
}

const LOW_THRESHOLD = 4.0;
const HIGH_THRESHOLD = 10.0;
const Y_MIN = 2.0;
const PADDING = { top: 32, right: 24, bottom: 48, left: 56 };
const MAX_PX_PER_MS = 0.04;
const FIT_ALL_EPSILON = 0.001;
const TICK_INTERVALS_MS = [
  30 * 60 * 1000,
  60 * 60 * 1000,
  2 * 60 * 60 * 1000,
  4 * 60 * 60 * 1000,
  6 * 60 * 60 * 1000,
  12 * 60 * 60 * 1000,
  24 * 60 * 60 * 1000
];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function getDayStartMs(timestampMs: number): number {
  const date = new Date(timestampMs);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function pickTickInterval(visibleDurationMs: number, chartWidth: number): number {
  const minLabelGap = 96;

  for (const interval of TICK_INTERVALS_MS) {
    const tickCount = visibleDurationMs / interval;
    if (tickCount <= 1) {
      return interval;
    }

    if (chartWidth / tickCount >= minLabelGap) {
      return interval;
    }
  }

  return TICK_INTERVALS_MS[TICK_INTERVALS_MS.length - 1];
}

function findFirstIndexAtOrAfter(values: number[], target: number): number {
  let low = 0;
  let high = values.length;

  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (values[mid] < target) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  return low;
}

function findLastIndexAtOrBefore(values: number[], target: number): number {
  let low = 0;
  let high = values.length;

  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (values[mid] <= target) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  return low - 1;
}

function findNearestIndex(values: number[], target: number): number {
  if (values.length === 0) {
    return -1;
  }

  const nextIdx = findFirstIndexAtOrAfter(values, target);
  if (nextIdx <= 0) {
    return 0;
  }

  if (nextIdx >= values.length) {
    return values.length - 1;
  }

  const prevIdx = nextIdx - 1;
  return Math.abs(values[nextIdx] - target) < Math.abs(values[prevIdx] - target)
    ? nextIdx
    : prevIdx;
}

function getYAxisTicks(yMax: number): number[] {
  const range = yMax - Y_MIN;
  const targetTickCount = 8;
  const roughStep = range / targetTickCount;

  if (roughStep <= 1) {
    const ticks: number[] = [];
    for (let value = Y_MIN; value <= yMax; value += 1) {
      ticks.push(value);
    }
    return ticks;
  }

  if (roughStep <= 2) {
    const ticks: number[] = [];
    for (let value = Y_MIN; value <= yMax; value += 2) {
      ticks.push(value);
    }
    return ticks;
  }

  const step = 4;
  const ticks: number[] = [Y_MIN];
  for (let value = 4; value <= yMax; value += step) {
    ticks.push(value);
  }
  if (ticks[ticks.length - 1] !== yMax) {
    ticks.push(yMax);
  }

  return ticks;
}

export function GlucoseChart({ data, height = 400, yMax = 25, colorMode }: GlucoseChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const scrollRef = useRef(0);
  const pxPerMsRef = useRef(0);
  const isDraggingRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef(0);
  const dragScrollRef = useRef(0);
  const rafRef = useRef<number>(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const dataSignatureRef = useRef('');

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    observer.observe(container);
    setContainerWidth(container.clientWidth);
    return () => observer.disconnect();
  }, []);

  const timestamps = data.map((point) => new Date(point.timestamp).getTime());
  const timeStartMs = timestamps[0] ?? 0;
  const timeEndMs = timestamps[timestamps.length - 1] ?? timeStartMs;
  const totalDurationMs = Math.max(1, timeEndMs - timeStartMs);
  const chartWidth = Math.max(0, containerWidth - PADDING.left - PADDING.right);
  const chartHeight = Math.max(0, height - PADDING.top - PADDING.bottom);
  const fitAllPxPerMs = chartWidth > 0 ? chartWidth / totalDurationMs : 0;
  const minPxPerMs = fitAllPxPerMs > 0 ? fitAllPxPerMs : 0;
  const hoveredPoint = hoveredIndex === null ? null : data[hoveredIndex] ?? null;

  useEffect(() => {
    if (data.length > 1 && chartWidth > 0 && fitAllPxPerMs > 0) {
      const signature = `${timeStartMs}:${timeEndMs}:${data.length}`;
      if (signature !== dataSignatureRef.current) {
        dataSignatureRef.current = signature;
        pxPerMsRef.current = fitAllPxPerMs;
        scrollRef.current = 0;
      } else if (pxPerMsRef.current <= fitAllPxPerMs * (1 + FIT_ALL_EPSILON)) {
        pxPerMsRef.current = fitAllPxPerMs;
        scrollRef.current = 0;
      } else if (pxPerMsRef.current < fitAllPxPerMs) {
        pxPerMsRef.current = fitAllPxPerMs;
      }
    }
  }, [data.length, chartWidth, fitAllPxPerMs, timeEndMs, timeStartMs]);

  const clampScroll = useCallback(() => {
    const maxAllowed = Math.max(0, totalDurationMs * pxPerMsRef.current - chartWidth);
    scrollRef.current = clamp(scrollRef.current, 0, maxAllowed);
  }, [chartWidth, totalDurationMs]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length || chartWidth <= 0 || chartHeight <= 0 || pxPerMsRef.current <= 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = containerWidth * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${containerWidth}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, containerWidth, height);

    const pxPerMs = pxPerMsRef.current;
    const totalContentWidth = totalDurationMs * pxPerMs;
    const maxVisibleScroll = Math.max(0, totalContentWidth - chartWidth);
    const scroll = clamp(scrollRef.current, 0, maxVisibleScroll);
    scrollRef.current = scroll;

    const visibleStartMs = timeStartMs + scroll / pxPerMs;
    const visibleEndMs = Math.min(timeEndMs, visibleStartMs + chartWidth / pxPerMs);
    const startIdx = Math.max(0, findFirstIndexAtOrAfter(timestamps, visibleStartMs) - 1);
    const endIdx = Math.min(data.length - 1, findLastIndexAtOrBefore(timestamps, visibleEndMs) + 1);

    function xForTimestamp(timestampMs: number): number {
      return PADDING.left + (timestampMs - timeStartMs) * pxPerMs - scroll;
    }

    function yForValue(value: number): number {
      const clamped = clamp(value, Y_MIN, yMax);
      return PADDING.top + chartHeight * (1 - (clamped - Y_MIN) / (yMax - Y_MIN));
    }

    const style = getComputedStyle(document.documentElement);
    const textSoft = style.getPropertyValue('--text-soft').trim() || '#64748b';
    const textDim = style.getPropertyValue('--text-dim').trim() || '#94a3b8';
    const border = style.getPropertyValue('--border').trim() || 'rgba(148,163,184,0.1)';

    const yLow = yForValue(LOW_THRESHOLD);
    const yHigh = yForValue(HIGH_THRESHOLD);
    const firstDayStartMs = getDayStartMs(visibleStartMs);

    for (let dayStartMs = firstDayStartMs; dayStartMs <= visibleEndMs + 24 * 60 * 60 * 1000; dayStartMs += 24 * 60 * 60 * 1000) {
      const nextDayStartMs = dayStartMs + 24 * 60 * 60 * 1000;
      const segmentStartMs = Math.max(dayStartMs, visibleStartMs);
      const segmentEndMs = Math.min(nextDayStartMs, visibleEndMs);

      if (segmentEndMs <= segmentStartMs) {
        continue;
      }

      const dayIndex = Math.floor((dayStartMs - firstDayStartMs) / (24 * 60 * 60 * 1000));
      if (dayIndex % 2 === 0) {
        const bandX = xForTimestamp(segmentStartMs);
        const bandWidth = (segmentEndMs - segmentStartMs) * pxPerMs;
        ctx.fillStyle = 'rgba(148, 163, 184, 0.025)';
        ctx.fillRect(bandX, PADDING.top, bandWidth, chartHeight);
      }
    }

    ctx.fillStyle = 'rgba(52, 211, 153, 0.06)';
    ctx.fillRect(PADDING.left, yHigh, chartWidth, yLow - yHigh);

    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;

    ctx.strokeStyle = getGlucoseColor(LOW_THRESHOLD, colorMode, 0.3);
    ctx.beginPath();
    ctx.moveTo(PADDING.left, yLow);
    ctx.lineTo(PADDING.left + chartWidth, yLow);
    ctx.stroke();

    ctx.strokeStyle = getGlucoseColor(HIGH_THRESHOLD, colorMode, 0.3);
    ctx.beginPath();
    ctx.moveTo(PADDING.left, yHigh);
    ctx.lineTo(PADDING.left + chartWidth, yHigh);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = '11px var(--font-plex-mono), monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    const yTicks = getYAxisTicks(yMax);
    for (const tick of yTicks) {
      const y = yForValue(tick);
      ctx.fillStyle = tick === LOW_THRESHOLD || tick === HIGH_THRESHOLD ? 'rgba(255,255,255,0.5)' : textSoft;
      ctx.fillText(tick.toString(), PADDING.left - 10, y);

      ctx.strokeStyle = border;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(PADDING.left, y);
      ctx.lineTo(PADDING.left + chartWidth, y);
      ctx.stroke();
    }

    const visibleDurationMs = Math.max(1, visibleEndMs - visibleStartMs);
    const tickIntervalMs = pickTickInterval(visibleDurationMs, chartWidth);
    const firstTickMs = Math.ceil(visibleStartMs / tickIntervalMs) * tickIntervalMs;
    let previousDateLabel = '';

    for (let dayStartMs = firstDayStartMs; dayStartMs <= visibleEndMs + 24 * 60 * 60 * 1000; dayStartMs += 24 * 60 * 60 * 1000) {
      if (dayStartMs < visibleStartMs || dayStartMs > visibleEndMs) {
        continue;
      }

      const x = xForTimestamp(dayStartMs);
      if (x < PADDING.left || x > PADDING.left + chartWidth) {
        continue;
      }

      ctx.strokeStyle = 'rgba(148, 163, 184, 0.28)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, PADDING.top);
      ctx.lineTo(x, PADDING.top + chartHeight);
      ctx.stroke();
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (let tickMs = firstTickMs; tickMs <= visibleEndMs; tickMs += tickIntervalMs) {
      const x = xForTimestamp(tickMs);
      if (x < PADDING.left || x > PADDING.left + chartWidth) continue;

      const date = new Date(tickMs);
      ctx.fillStyle = textDim;
      ctx.font = '11px var(--font-plex-mono), monospace';
      ctx.fillText(formatTime(date), x, height - PADDING.bottom + 8);

      const currentDateLabel = formatDate(date);
      const shouldShowDate =
        previousDateLabel !== currentDateLabel &&
        (date.getHours() === 0 || tickIntervalMs >= 12 * 60 * 60 * 1000);

      if (shouldShowDate) {
        ctx.fillStyle = textSoft;
        ctx.font = '10px var(--font-plex-mono), monospace';
        ctx.fillText(currentDateLabel, x, height - PADDING.bottom + 24);
        previousDateLabel = currentDateLabel;
      }
    }

    ctx.save();
    ctx.beginPath();
    ctx.rect(PADDING.left, PADDING.top - 4, chartWidth, chartHeight + 8);
    ctx.clip();

    if (endIdx > startIdx) {
      const gradient = ctx.createLinearGradient(0, PADDING.top, 0, PADDING.top + chartHeight);
      gradient.addColorStop(0, 'rgba(52, 211, 153, 0.12)');
      gradient.addColorStop(1, 'rgba(52, 211, 153, 0.01)');

      ctx.beginPath();
      ctx.moveTo(xForTimestamp(timestamps[startIdx]), PADDING.top + chartHeight);
      for (let i = startIdx; i <= endIdx; i++) {
        ctx.lineTo(xForTimestamp(timestamps[i]), yForValue(data[i].valueMmolL));
      }
      ctx.lineTo(xForTimestamp(timestamps[endIdx]), PADDING.top + chartHeight);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    for (let i = startIdx; i < endIdx; i++) {
      const x1 = xForTimestamp(timestamps[i]);
      const y1 = yForValue(data[i].valueMmolL);
      const x2 = xForTimestamp(timestamps[i + 1]);
      const y2 = yForValue(data[i + 1].valueMmolL);
      const avgValue = (data[i].valueMmolL + data[i + 1].valueMmolL) / 2;

      ctx.strokeStyle = getGlucoseColor(avgValue, colorMode);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    const showDots = pxPerMs * 5 * 60 * 1000 >= 6;
    if (showDots) {
      for (let i = startIdx; i <= endIdx; i++) {
        const x = xForTimestamp(timestamps[i]);
        const y = yForValue(data[i].valueMmolL);
        const color = getGlucoseColor(data[i].valueMmolL, colorMode);
        const isShare = data[i].source === 'share';

        ctx.beginPath();
        ctx.arc(x, y, isShare ? 2.5 : 3, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        if (isShare) {
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    if (hoveredIndex !== null && hoveredIndex >= startIdx && hoveredIndex <= endIdx) {
      const hoverX = xForTimestamp(timestamps[hoveredIndex]);
      const hoverY = yForValue(data[hoveredIndex].valueMmolL);

      ctx.setLineDash([3, 5]);
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.55)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(hoverX, PADDING.top);
      ctx.lineTo(hoverX, PADDING.top + chartHeight);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.beginPath();
      ctx.arc(hoverX, hoverY, 4, 0, Math.PI * 2);
      ctx.fillStyle = style.getPropertyValue('--surface-strong').trim() || '#020817';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(hoverX, hoverY, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = getGlucoseColor(data[hoveredIndex].valueMmolL, colorMode);
      ctx.fill();
    }

    ctx.restore();

    if (totalContentWidth > chartWidth + 1) {
      const barWidth = Math.max(40, (chartWidth / totalContentWidth) * chartWidth);
      const barX = maxVisibleScroll > 0
        ? PADDING.left + (scroll / maxVisibleScroll) * (chartWidth - barWidth)
        : PADDING.left;
      const barY = height - 4;

      ctx.fillStyle = 'rgba(148, 163, 184, 0.15)';
      ctx.beginPath();
      ctx.roundRect(barX, barY, barWidth, 3, 1.5);
      ctx.fill();
    }
  }, [chartHeight, chartWidth, colorMode, containerWidth, data, height, hoveredIndex, timeEndMs, timeStartMs, timestamps, totalDurationMs, yMax]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  const handleWheel = useCallback((e: WheelEvent) => {
    if (chartWidth <= 0 || totalDurationMs <= 0 || pxPerMsRef.current <= 0) {
      return;
    }

    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const mouseX = clamp(e.offsetX - PADDING.left, 0, chartWidth);
      const oldPxPerMs = pxPerMsRef.current;
      const targetTimeMs = timeStartMs + (scrollRef.current + mouseX) / oldPxPerMs;
      const newPxPerMs = clamp(oldPxPerMs * zoomFactor, minPxPerMs, MAX_PX_PER_MS);

      if (newPxPerMs <= fitAllPxPerMs * (1 + FIT_ALL_EPSILON)) {
        pxPerMsRef.current = fitAllPxPerMs;
        scrollRef.current = 0;
      } else {
        pxPerMsRef.current = newPxPerMs;
        scrollRef.current = (targetTimeMs - timeStartMs) * newPxPerMs - mouseX;
      }
    } else if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 0) {
      e.preventDefault();
      scrollRef.current += e.deltaX;
    } else {
      return;
    }

    clampScroll();
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(draw);
  }, [chartWidth, clampScroll, draw, fitAllPxPerMs, minPxPerMs, timeStartMs, totalDurationMs]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDraggingRef.current = true;
    setIsDragging(true);
    dragStartRef.current = e.clientX;
    dragScrollRef.current = scrollRef.current;
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length || chartWidth <= 0 || pxPerMsRef.current <= 0) return;

    if (isDraggingRef.current) {
      const delta = dragStartRef.current - e.clientX;
      scrollRef.current = dragScrollRef.current + delta;
      clampScroll();
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(draw);
      setHoveredIndex(null);
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (
      mouseX < PADDING.left ||
      mouseX > PADDING.left + chartWidth ||
      mouseY < PADDING.top ||
      mouseY > PADDING.top + chartHeight
    ) {
      setHoveredIndex(null);
      return;
    }

    const targetTimeMs = timeStartMs + (mouseX - PADDING.left + scrollRef.current) / pxPerMsRef.current;
    const nearestIndex = findNearestIndex(timestamps, targetTimeMs);

    if (nearestIndex >= 0) {
      setHoveredIndex(nearestIndex);
      setHoverPos({ x: mouseX, y: mouseY });
    } else {
      setHoveredIndex(null);
    }
  }, [chartHeight, chartWidth, clampScroll, data.length, draw, timeStartMs, timestamps]);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    isDraggingRef.current = false;
    setIsDragging(false);
    setHoveredIndex(null);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const touchStartRef = useRef<{ x: number; scroll: number } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = { x: e.touches[0].clientX, scroll: scrollRef.current };
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1 && touchStartRef.current) {
      const delta = touchStartRef.current.x - e.touches[0].clientX;
      scrollRef.current = touchStartRef.current.scroll + delta;
      clampScroll();
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(draw);
      setHoveredIndex(null);
    }
  }, [clampScroll, draw]);

  const handleTouchEnd = useCallback(() => {
    touchStartRef.current = null;
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height,
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'none'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
      {hoveredPoint && (
        <div
          style={{
            position: 'absolute',
            left: Math.min(hoverPos.x + 12, containerWidth - 180),
            top: Math.max(8, hoverPos.y - 60),
            background: 'var(--surface-strong)',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius)',
            padding: '8px 12px',
            pointerEvents: 'none',
            backdropFilter: 'blur(12px)',
            zIndex: 10,
            minWidth: 140
          }}
        >
          <p style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 700,
            fontFamily: 'var(--font-plex-mono), monospace',
            color: getGlucoseColor(hoveredPoint.valueMmolL, colorMode)
          }}>
            {hoveredPoint.valueMmolL.toFixed(1)} <span style={{ fontSize: 11, color: 'var(--text-soft)' }}>mmol/L</span>
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-dim)' }}>
            {new Date(hoveredPoint.timestamp).toLocaleString([], {
              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            })}
          </p>
          <p style={{
            margin: '2px 0 0',
            fontSize: 10,
            color: 'var(--text-soft)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em'
          }}>
            {hoveredPoint.source}
          </p>
        </div>
      )}
    </div>
  );
}
