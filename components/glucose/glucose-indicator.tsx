'use client';

import type { CSSProperties } from 'react';
import { useEffect, useId, useState } from 'react';

type GlucoseRange = 'low' | 'normal' | 'high';
type TrendDirection = 'up' | 'up-slight' | 'stable' | 'down-slight' | 'down';
type IndicatorSize = 'sm' | 'md' | 'lg';

interface GlucoseIndicatorProps {
  value: number;
  trend: string;
  size?: IndicatorSize;
  unit?: string;
  timestamp?: string;
}

const RANGE_COLORS = {
  low: {
    dark: {
      fill: '#ef4444',
      stroke: '#dc2626',
      gradientLight: '#fca5a5',
      gradientDark: '#991b1b',
      bgFill: 'rgba(69, 10, 10, 0.4)',
      text: '#ffffff',
      subText: '#fda4af'
    },
    light: {
      fill: '#ef4444',
      stroke: '#dc2626',
      gradientLight: '#fca5a5',
      gradientDark: '#991b1b',
      bgFill: '#fef2f2',
      text: '#b91c1c',
      subText: '#991b1b'
    }
  },
  normal: {
    dark: {
      fill: '#10b981',
      stroke: '#059669',
      gradientLight: '#6ee7b7',
      gradientDark: '#047857',
      bgFill: 'rgba(2, 50, 26, 0.4)',
      text: '#ffffff',
      subText: '#9fdcc4'
    },
    light: {
      fill: '#10b981',
      stroke: '#059669',
      gradientLight: '#6ee7b7',
      gradientDark: '#047857',
      bgFill: '#ecfdf5',
      text: '#047857',
      subText: '#065f46'
    }
  },
  high: {
    dark: {
      fill: '#eab308',
      stroke: '#ca8a04',
      gradientLight: '#fde047',
      gradientDark: '#a16207',
      bgFill: 'rgba(66, 32, 6, 0.45)',
      text: '#ffffff',
      subText: '#fcd34d'
    },
    light: {
      fill: '#eab308',
      stroke: '#ca8a04',
      gradientLight: '#fef08a',
      gradientDark: '#a16207',
      bgFill: '#fefce8',
      text: '#a16207',
      subText: '#854d0e'
    }
  }
} as const;

const SIZE_CONFIG: Record<IndicatorSize, {
  outer: number;
  ringStroke: number;
  fontSize: number;
  unitSize: number;
  ageSize: number;
  arrowSize: number;
  arrowOffset: number;
  gapDegrees: number;
}> = {
  sm: { outer: 112, ringStroke: 6, fontSize: 22, unitSize: 12, ageSize: 11, arrowSize: 14, arrowOffset: 8, gapDegrees: 18 },
  md: { outer: 146, ringStroke: 8, fontSize: 34, unitSize: 13, ageSize: 12, arrowSize: 18, arrowOffset: 10, gapDegrees: 18 },
  lg: { outer: 184, ringStroke: 10, fontSize: 52, unitSize: 14, ageSize: 13, arrowSize: 22, arrowOffset: 12, gapDegrees: 18 }
};

function classifyRange(value: number): GlucoseRange {
  if (value < 4.0) return 'low';
  if (value > 10.0) return 'high';
  return 'normal';
}

function normalizeTrend(trend: string): TrendDirection {
  const normalized = trend.toLowerCase().replace(/[^a-z]/g, '');
  if (normalized.includes('risingfast') || normalized.includes('doubleup') || normalized === 'risingquickly') return 'up';
  if (normalized.includes('rising') || normalized.includes('singleup') || normalized === 'up') return 'up-slight';
  if (normalized.includes('fallingfast') || normalized.includes('doubledown') || normalized === 'fallingquickly') return 'down';
  if (normalized.includes('falling') || normalized.includes('singledown') || normalized === 'down') return 'down-slight';
  return 'stable';
}

function formatAge(timestamp: string): string {
  const age = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.round(age / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes === 1) return '1m ago';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m ago`;
}

function TrendArrow({
  direction,
  color,
  size,
  offset
}: {
  direction: TrendDirection;
  color: string;
  size: number;
  offset: number;
}) {
  const half = size / 2;
  const arrows: Record<TrendDirection, { transform: string; position: CSSProperties }> = {
    up: {
      transform: '',
      position: { top: -offset - size, left: '50%', marginLeft: -half }
    },
    'up-slight': {
      transform: 'rotate(45deg)',
      position: { top: -offset - half, right: -offset - half }
    },
    stable: {
      transform: 'rotate(90deg)',
      position: { top: '50%', right: -offset - size, marginTop: -half }
    },
    'down-slight': {
      transform: 'rotate(135deg)',
      position: { bottom: -offset - half, right: -offset - half }
    },
    down: {
      transform: 'rotate(180deg)',
      position: { bottom: -offset - size, left: '50%', marginLeft: -half }
    }
  };

  const { transform, position } = arrows[direction];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ position: 'absolute', ...position, transform }}
    >
      <path d="M12 4L6 12h4v8h4v-8h4L12 4z" fill={color} />
    </svg>
  );
}

export function GlucoseIndicator({
  value,
  trend,
  size = 'lg',
  unit = 'mmol/L',
  timestamp
}: GlucoseIndicatorProps) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [, setTick] = useState(0);
  const gradientId = useId().replace(/:/g, '-');
  const glowId = `${gradientId}-glow`;
  const range = classifyRange(value);
  const direction = normalizeTrend(trend);
  const colors = RANGE_COLORS[range][theme];
  const config = SIZE_CONFIG[size];
  const radius = (config.outer - config.ringStroke) / 2;
  const center = config.outer / 2;
  const circumference = 2 * Math.PI * radius;
  const gapLength = circumference * (config.gapDegrees / 360);
  const visibleLength = circumference - gapLength;

  useEffect(() => {
    const applyTheme = () => {
      setTheme(document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');
    };

    applyTheme();

    const observer = new MutationObserver(applyTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!timestamp) {
      return;
    }

    const interval = window.setInterval(() => {
      setTick((current) => current + 1);
    }, 60_000);

    return () => window.clearInterval(interval);
  }, [timestamp]);

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div style={{ position: 'relative', width: config.outer, height: config.outer }}>
        <svg width={config.outer} height={config.outer} viewBox={`0 0 ${config.outer} ${config.outer}`}>
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.gradientLight} />
              <stop offset="45%" stopColor={colors.fill} />
              <stop offset="100%" stopColor={colors.gradientDark} />
            </linearGradient>
            <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation={theme === 'dark' ? 4 : 2} result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <circle
            cx={center}
            cy={center}
            r={radius - config.ringStroke * 0.85}
            fill={colors.bgFill}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
          />
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgba(148, 163, 184, 0.18)"
            strokeWidth={config.ringStroke}
          />
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={config.ringStroke}
            strokeDasharray={`${visibleLength} ${gapLength}`}
            strokeDashoffset={circumference * 0.12}
            strokeLinecap="round"
            filter={`url(#${glowId})`}
          />
          <text
            x={center}
            y={center}
            textAnchor="middle"
            dominantBaseline="central"
            fill={colors.text}
            fontSize={config.fontSize}
            fontWeight={700}
            fontFamily="var(--font-plex-mono), monospace"
            style={{ letterSpacing: '-0.04em' }}
          >
            {value.toFixed(1)}
          </text>
        </svg>
        <TrendArrow
          direction={direction}
          color={colors.fill}
          size={config.arrowSize}
          offset={config.arrowOffset}
        />
      </div>

      <span style={{
        fontSize: config.unitSize,
        color: colors.subText,
        fontWeight: 600,
        letterSpacing: '0.14em',
        textTransform: 'uppercase'
      }}>
        {unit}
      </span>

      {timestamp && (
        <span style={{
          fontSize: config.ageSize,
          color: 'var(--text-dim)'
        }}>
          {formatAge(timestamp)}
        </span>
      )}
    </div>
  );
}
