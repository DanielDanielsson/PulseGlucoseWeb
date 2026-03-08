'use client';

import { useEffect, useState } from 'react';
import { GlucoseIndicator } from './glucose-indicator';

interface LatestReading {
  valueMmolL: number;
  trend: string;
  timestamp: string;
}

export function DashboardGlucoseBadge() {
  const [latest, setLatest] = useState<LatestReading | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchLatest() {
      try {
        const res = await fetch('/api/dashboard/glucose/history?limit=1');
        if (!res.ok) return;
        const json = await res.json();
        if (mounted && json.latest) {
          setLatest(json.latest);
        }
      } catch {
        // Silent fail
      }
    }

    fetchLatest();

    function handleEvent(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (detail && mounted) {
        setLatest(detail);
      }
    }

    window.addEventListener('pulse-glucose-latest', handleEvent);
    return () => {
      mounted = false;
      window.removeEventListener('pulse-glucose-latest', handleEvent);
    };
  }, []);

  if (!latest) return null;

  return (
    <GlucoseIndicator
      value={latest.valueMmolL}
      trend={latest.trend}
      timestamp={latest.timestamp}
      size="lg"
    />
  );
}
