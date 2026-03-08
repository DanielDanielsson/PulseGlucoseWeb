export interface ChartPoint {
  timestamp: string;
  valueMmolL: number;
  source: 'official' | 'share';
}

export interface LatestReading {
  valueMmolL: number;
  valueMgDl: number;
  trend: string;
  timestamp: string;
  source: 'official' | 'share';
}

export interface GlucoseApiResponse {
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

export interface GlucoseUpdatesResponse {
  latest: LatestReading | null;
  meta: {
    since: string;
    to: string;
    newCount: number;
  };
  error?: { message: string };
}
