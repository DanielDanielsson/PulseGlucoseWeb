'use client';

import { useRef, useEffect, useCallback, useState } from 'react';

export interface ChartPoint {
  timestamp: string;
  valueMmolL: number;
  source: 'official' | 'share';
}

interface GlucoseChartProps {
  data: ChartPoint[];
  height?: number;
}

const LOW_THRESHOLD = 4.0;
const HIGH_THRESHOLD = 10.0;
const Y_MIN = 2.0;
const Y_MAX = 18.0;
const PADDING = { top: 32, right: 24, bottom: 48, left: 56 };
const MAX_PX_PER_POINT = 40;

function getPointColor(value: number): string {
  if (value < LOW_THRESHOLD) return '#fb7185';
  if (value > HIGH_THRESHOLD) return '#fbbf24';
  return '#34d399';
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function GlucoseChart({ data, height = 400 }: GlucoseChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const scrollRef = useRef(0);
  const pxPerPointRef = useRef(1);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef(0);
  const dragScrollRef = useRef(0);
  const rafRef = useRef<number>(0);
  const [hoveredPoint, setHoveredPoint] = useState<ChartPoint | null>(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const hasInitializedRef = useRef(false);

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

  const chartWidth = containerWidth - PADDING.left - PADDING.right;
  const chartHeight = height - PADDING.top - PADDING.bottom;

  // Compute fit-all px per point (the minimum zoom that shows everything)
  const fitAllPx = data.length > 1 ? chartWidth / (data.length - 1) : chartWidth;
  const minPxPerPoint = Math.max(0.2, fitAllPx);

  const totalContentWidth = data.length > 1
    ? (data.length - 1) * pxPerPointRef.current
    : chartWidth;
  const maxScroll = Math.max(0, totalContentWidth - chartWidth);

  // Initialize to fit-all on first data load
  useEffect(() => {
    if (data.length > 1 && chartWidth > 0 && !hasInitializedRef.current) {
      pxPerPointRef.current = fitAllPx;
      scrollRef.current = 0;
      hasInitializedRef.current = true;
    }
  }, [data.length, chartWidth, fitAllPx]);

  // Reset when data changes (new time range selected)
  const dataLenRef = useRef(0);
  useEffect(() => {
    if (data.length !== dataLenRef.current && data.length > 1 && chartWidth > 0) {
      dataLenRef.current = data.length;
      pxPerPointRef.current = fitAllPx;
      scrollRef.current = 0;
    }
  }, [data.length, chartWidth, fitAllPx]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length || chartWidth <= 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = containerWidth * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${containerWidth}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, containerWidth, height);

    const pxPerPoint = pxPerPointRef.current;
    const scroll = Math.max(0, Math.min(scrollRef.current, maxScroll));
    scrollRef.current = scroll;

    const startIdx = Math.max(0, Math.floor(scroll / pxPerPoint) - 1);
    const visiblePoints = Math.ceil(chartWidth / pxPerPoint) + 2;
    const endIdx = Math.min(data.length - 1, startIdx + visiblePoints);

    function xForIndex(i: number): number {
      return PADDING.left + i * pxPerPoint - scroll;
    }

    function yForValue(v: number): number {
      const clamped = Math.max(Y_MIN, Math.min(Y_MAX, v));
      return PADDING.top + chartHeight * (1 - (clamped - Y_MIN) / (Y_MAX - Y_MIN));
    }

    // Read CSS variables
    const style = getComputedStyle(document.documentElement);
    const textSoft = style.getPropertyValue('--text-soft').trim() || '#64748b';
    const textDim = style.getPropertyValue('--text-dim').trim() || '#94a3b8';
    const border = style.getPropertyValue('--border').trim() || 'rgba(148,163,184,0.1)';

    // Target range band
    const yLow = yForValue(LOW_THRESHOLD);
    const yHigh = yForValue(HIGH_THRESHOLD);
    ctx.fillStyle = 'rgba(52, 211, 153, 0.06)';
    ctx.fillRect(PADDING.left, yHigh, chartWidth, yLow - yHigh);

    // Threshold lines
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;

    ctx.strokeStyle = 'rgba(251, 113, 133, 0.3)';
    ctx.beginPath();
    ctx.moveTo(PADDING.left, yLow);
    ctx.lineTo(PADDING.left + chartWidth, yLow);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(251, 191, 36, 0.3)';
    ctx.beginPath();
    ctx.moveTo(PADDING.left, yHigh);
    ctx.lineTo(PADDING.left + chartWidth, yHigh);
    ctx.stroke();

    ctx.setLineDash([]);

    // Y axis labels
    ctx.font = '11px var(--font-plex-mono), monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    const yTicks = [2, 4, 6, 8, 10, 12, 14, 16, 18];
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

    // X axis labels
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = textDim;
    let lastLabelX = -Infinity;
    const labelGap = 80;

    for (let i = startIdx; i <= endIdx; i++) {
      const x = xForIndex(i);
      if (x < PADDING.left || x > PADDING.left + chartWidth) continue;
      if (x - lastLabelX < labelGap) continue;

      const date = new Date(data[i].timestamp);
      const minutes = date.getMinutes();
      const hours = date.getHours();

      if (minutes !== 0 && minutes !== 30 && pxPerPoint < 15) continue;

      ctx.fillStyle = textDim;
      ctx.font = '11px var(--font-plex-mono), monospace';
      ctx.fillText(formatTime(date), x, height - PADDING.bottom + 8);

      if (hours === 0 && minutes === 0) {
        ctx.fillStyle = textSoft;
        ctx.font = '10px var(--font-plex-mono), monospace';
        ctx.fillText(formatDate(date), x, height - PADDING.bottom + 24);
      }

      lastLabelX = x;
    }

    // Clip chart area
    ctx.save();
    ctx.beginPath();
    ctx.rect(PADDING.left, PADDING.top - 4, chartWidth, chartHeight + 8);
    ctx.clip();

    // Draw gradient area under line
    if (endIdx > startIdx) {
      const gradient = ctx.createLinearGradient(0, PADDING.top, 0, PADDING.top + chartHeight);
      gradient.addColorStop(0, 'rgba(52, 211, 153, 0.12)');
      gradient.addColorStop(1, 'rgba(52, 211, 153, 0.01)');

      ctx.beginPath();
      ctx.moveTo(xForIndex(startIdx), PADDING.top + chartHeight);
      for (let i = startIdx; i <= endIdx; i++) {
        ctx.lineTo(xForIndex(i), yForValue(data[i].valueMmolL));
      }
      ctx.lineTo(xForIndex(endIdx), PADDING.top + chartHeight);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    // Draw line segments color-coded by range
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    for (let i = startIdx; i < endIdx; i++) {
      const x1 = xForIndex(i);
      const y1 = yForValue(data[i].valueMmolL);
      const x2 = xForIndex(i + 1);
      const y2 = yForValue(data[i + 1].valueMmolL);
      const avgValue = (data[i].valueMmolL + data[i + 1].valueMmolL) / 2;

      ctx.strokeStyle = getPointColor(avgValue);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Draw dots when zoomed in enough
    const showDots = pxPerPoint >= 6;
    if (showDots) {
      for (let i = startIdx; i <= endIdx; i++) {
        const x = xForIndex(i);
        const y = yForValue(data[i].valueMmolL);
        const color = getPointColor(data[i].valueMmolL);
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

    ctx.restore();

    // Scrollbar indicator (only when zoomed in past fit-all)
    if (totalContentWidth > chartWidth + 1) {
      const barWidth = Math.max(40, (chartWidth / totalContentWidth) * chartWidth);
      const barX = maxScroll > 0
        ? PADDING.left + (scroll / maxScroll) * (chartWidth - barWidth)
        : PADDING.left;
      const barY = height - 4;

      ctx.fillStyle = 'rgba(148, 163, 184, 0.15)';
      ctx.beginPath();
      ctx.roundRect(barX, barY, barWidth, 3, 1.5);
      ctx.fill();
    }
  }, [data, containerWidth, height, chartWidth, chartHeight, maxScroll, totalContentWidth]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  const clampScroll = useCallback(() => {
    const cw = containerWidth - PADDING.left - PADDING.right;
    const tw = data.length > 1 ? (data.length - 1) * pxPerPointRef.current : cw;
    const ms = Math.max(0, tw - cw);
    scrollRef.current = Math.max(0, Math.min(scrollRef.current, ms));
  }, [data.length, containerWidth]);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();

    if (e.ctrlKey || e.metaKey) {
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const mouseX = e.offsetX - PADDING.left;
      const oldPx = pxPerPointRef.current;
      const newPx = Math.max(minPxPerPoint, Math.min(MAX_PX_PER_POINT, oldPx * zoomFactor));
      const scrollRatio = (scrollRef.current + mouseX) / (Math.max(1, data.length - 1) * oldPx);
      pxPerPointRef.current = newPx;
      scrollRef.current = scrollRatio * Math.max(1, data.length - 1) * newPx - mouseX;
    } else {
      scrollRef.current += e.deltaX || e.deltaY;
    }

    clampScroll();
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(draw);
  }, [data.length, minPxPerPoint, draw, clampScroll]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDraggingRef.current = true;
    dragStartRef.current = e.clientX;
    dragScrollRef.current = scrollRef.current;
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length) return;

    if (isDraggingRef.current) {
      const delta = dragStartRef.current - e.clientX;
      scrollRef.current = dragScrollRef.current + delta;
      clampScroll();
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(draw);
      setHoveredPoint(null);
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (mouseX < PADDING.left || mouseX > PADDING.left + chartWidth) {
      setHoveredPoint(null);
      return;
    }

    const dataX = mouseX - PADDING.left + scrollRef.current;
    const idx = Math.round(dataX / pxPerPointRef.current);

    if (idx >= 0 && idx < data.length) {
      setHoveredPoint(data[idx]);
      setHoverPos({ x: e.clientX - rect.left, y: mouseY });
    } else {
      setHoveredPoint(null);
    }
  }, [data, chartWidth, draw, clampScroll]);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  const handleMouseLeave = useCallback(() => {
    isDraggingRef.current = false;
    setHoveredPoint(null);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // Touch support
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
    }
  }, [draw, clampScroll]);

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
          cursor: isDraggingRef.current ? 'grabbing' : 'grab',
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
            color: getPointColor(hoveredPoint.valueMmolL)
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
