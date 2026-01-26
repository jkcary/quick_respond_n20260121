export type PerfEvent = {
  name: string;
  durationMs: number;
  success?: boolean;
  errorType?: string;
  source?: string;
  provider?: string;
  batchSize?: number;
  timestamp?: string;
  meta?: Record<string, unknown>;
};

type PerfStats = {
  count: number;
  errorCount: number;
  samples: number[];
  p50?: number;
  p95?: number;
  lastAt?: string;
};

type PerfStatsMap = Record<string, PerfStats>;

const PERF_STATS_KEY = 'eaa_perf_stats_v1';
const PERF_LOG_ENDPOINT = '/api/perf-log';
const MAX_SAMPLES = 200;

let cachedStats: PerfStatsMap | null = null;
let persistTimer: number | null = null;

const safeGetLocalStorage = (): Storage | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.localStorage ?? null;
};

const loadStats = (): PerfStatsMap => {
  if (cachedStats) {
    return cachedStats;
  }
  try {
    const storage = safeGetLocalStorage();
    if (!storage) {
      cachedStats = {};
      return cachedStats;
    }
    const raw = storage.getItem(PERF_STATS_KEY);
    if (!raw) {
      cachedStats = {};
      return cachedStats;
    }
    cachedStats = JSON.parse(raw) as PerfStatsMap;
  } catch {
    cachedStats = {};
  }
  return cachedStats;
};

const persistStats = () => {
  if (typeof window === 'undefined') {
    return;
  }
  if (persistTimer !== null) {
    return;
  }
  persistTimer = window.setTimeout(() => {
    persistTimer = null;
    try {
      const storage = safeGetLocalStorage();
      if (!storage || !cachedStats) {
        return;
      }
      storage.setItem(PERF_STATS_KEY, JSON.stringify(cachedStats));
    } catch {
      // Ignore storage errors.
    }
  }, 1500);
};

const computePercentile = (samples: number[], percentile: number): number => {
  if (samples.length === 0) {
    return 0;
  }
  const sorted = [...samples].sort((a, b) => a - b);
  const index = Math.max(0, Math.ceil((percentile / 100) * sorted.length) - 1);
  return sorted[Math.min(index, sorted.length - 1)];
};

const updateStats = (event: PerfEvent) => {
  const statsMap = loadStats();
  const key = event.name;
  const existing = statsMap[key] ?? {
    count: 0,
    errorCount: 0,
    samples: [],
  };

  existing.count += 1;
  if (event.success === false) {
    existing.errorCount += 1;
  }

  if (Number.isFinite(event.durationMs)) {
    existing.samples.push(event.durationMs);
    if (existing.samples.length > MAX_SAMPLES) {
      existing.samples.splice(0, existing.samples.length - MAX_SAMPLES);
    }
    existing.p50 = computePercentile(existing.samples, 50);
    existing.p95 = computePercentile(existing.samples, 95);
  }

  existing.lastAt = event.timestamp ?? new Date().toISOString();
  statsMap[key] = existing;
  cachedStats = statsMap;
  persistStats();
};

const sendEvent = (payload: PerfEvent) => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon(PERF_LOG_ENDPOINT, blob);
      return;
    }
    void fetch(PERF_LOG_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    });
  } catch {
    // Ignore network errors.
  }
};

export const logPerfEvent = (event: PerfEvent): void => {
  const payload = {
    ...event,
    timestamp: event.timestamp ?? new Date().toISOString(),
  };

  updateStats(payload);
  sendEvent(payload);
};

export const getPerfStats = (): PerfStatsMap => {
  return { ...loadStats() };
};
