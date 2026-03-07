'use client';

type GlucoseRange = 'low' | 'normal' | 'high';
type TrendDirection = 'risingFast' | 'rising' | 'stable' | 'falling' | 'fallingFast';
type IndicatorSize = 'sm' | 'md' | 'lg';

interface GlucoseIndicatorProps {
  value: number;
  trend: string;
  size?: IndicatorSize;
  unit?: string;
  timestamp?: string;
}

function classifyRange(value: number): GlucoseRange {
  if (value < 4.0) return 'low';
  if (value > 10.0) return 'high';
  return 'normal';
}

function normalizeTrend(trend: string): TrendDirection {
  const t = trend.toLowerCase().replace(/[^a-z]/g, '');
  if (t.includes('risingfast') || t.includes('doubleup') || t === 'risingquickly') return 'risingFast';
  if (t.includes('rising') || t.includes('singleup') || t === 'up') return 'rising';
  if (t.includes('fallingfast') || t.includes('doubledown') || t === 'fallingquickly') return 'fallingFast';
  if (t.includes('falling') || t.includes('singledown') || t === 'down') return 'falling';
  return 'stable';
}

const RANGE_COLORS: Record<GlucoseRange, { ring: string; glow: string }> = {
  low: { ring: '#fb7185', glow: 'rgba(251, 113, 133, 0.3)' },
  normal: { ring: '#34d399', glow: 'rgba(52, 211, 153, 0.3)' },
  high: { ring: '#fbbf24', glow: 'rgba(251, 191, 36, 0.3)' }
};

const SIZE_CONFIG: Record<IndicatorSize, {
  outer: number;
  stroke: number;
  fontSize: number;
  arrowSize: number;
  arrowOffset: number;
}> = {
  sm: { outer: 64, stroke: 3, fontSize: 18, arrowSize: 10, arrowOffset: 6 },
  md: { outer: 96, stroke: 4, fontSize: 28, arrowSize: 14, arrowOffset: 8 },
  lg: { outer: 128, stroke: 5, fontSize: 38, arrowSize: 18, arrowOffset: 10 }
};

function TrendArrow({ direction, color, size, offset }: {
  direction: TrendDirection;
  color: string;
  size: number;
  offset: number;
}) {
  const half = size / 2;

  const arrows: Record<TrendDirection, { transform: string; position: React.CSSProperties }> = {
    risingFast: {
      transform: '',
      position: { top: -offset - size, left: '50%', marginLeft: -half }
    },
    rising: {
      transform: 'rotate(45deg)',
      position: { top: -offset - half, right: -offset - half }
    },
    stable: {
      transform: 'rotate(90deg)',
      position: { top: '50%', right: -offset - size, marginTop: -half }
    },
    falling: {
      transform: 'rotate(135deg)',
      position: { bottom: -offset - half, right: -offset - half }
    },
    fallingFast: {
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
      <path
        d="M12 4L6 12h4v8h4v-8h4L12 4z"
        fill={color}
      />
    </svg>
  );
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

export function GlucoseIndicator({
  value,
  trend,
  size = 'lg',
  unit = 'mmol/L',
  timestamp
}: GlucoseIndicatorProps) {
  const range = classifyRange(value);
  const direction = normalizeTrend(trend);
  const colors = RANGE_COLORS[range];
  const config = SIZE_CONFIG[size];
  const radius = (config.outer - config.stroke) / 2;
  const center = config.outer / 2;

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ position: 'relative', width: config.outer, height: config.outer }}>
        <svg
          width={config.outer}
          height={config.outer}
          viewBox={`0 0 ${config.outer} ${config.outer}`}
        >
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={colors.ring}
            strokeWidth={config.stroke}
            opacity={0.25}
          />
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={colors.ring}
            strokeWidth={config.stroke}
            strokeDasharray={`${2 * Math.PI * radius * 0.75} ${2 * Math.PI * radius * 0.25}`}
            strokeDashoffset={2 * Math.PI * radius * 0.25}
            strokeLinecap="round"
            filter={`drop-shadow(0 0 6px ${colors.glow})`}
          />
          <text
            x={center}
            y={center}
            textAnchor="middle"
            dominantBaseline="central"
            fill="var(--text)"
            fontSize={config.fontSize}
            fontWeight={700}
            fontFamily="var(--font-plex-mono), monospace"
          >
            {value.toFixed(1)}
          </text>
        </svg>
        <TrendArrow
          direction={direction}
          color={colors.ring}
          size={config.arrowSize}
          offset={config.arrowOffset}
        />
      </div>
      <span style={{
        fontSize: size === 'sm' ? 10 : size === 'md' ? 12 : 13,
        color: 'var(--text-soft)',
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase'
      }}>
        {unit}
      </span>
      {timestamp && (
        <span style={{
          fontSize: size === 'sm' ? 10 : 12,
          color: 'var(--text-dim)',
        }}>
          {formatAge(timestamp)}
        </span>
      )}
    </div>
  );
}
