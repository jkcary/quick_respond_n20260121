/**
 * PerfDiagnostics component - Display local performance stats
 */

import React, { useMemo, useState } from 'react';
import { Button } from '@/components/common';
import { useI18n } from '@/i18n';
import { clearPerfStats, getPerfStats } from '@/utils/perfLogger';

type PerfRow = {
  name: string;
  count: number;
  errorCount: number;
  p50?: number;
  p95?: number;
  lastAt?: string;
};

const formatMs = (value?: number): string => {
  if (value === undefined || !Number.isFinite(value)) {
    return '-';
  }
  return `${Math.round(value)}ms`;
};

const formatRate = (errorCount: number, count: number): string => {
  if (count <= 0) {
    return '-';
  }
  return `${((errorCount / count) * 100).toFixed(1)}%`;
};

export const PerfDiagnostics: React.FC = () => {
  const { t } = useI18n();
  const [stats, setStats] = useState(() => getPerfStats());
  const [lastUpdated, setLastUpdated] = useState(() => new Date());

  const rows = useMemo<PerfRow[]>(() => {
    const entries = Object.entries(stats);
    return entries
      .map(([name, stat]) => ({
        name,
        count: stat.count,
        errorCount: stat.errorCount,
        p50: stat.p50,
        p95: stat.p95,
        lastAt: stat.lastAt,
      }))
      .sort((a, b) => b.count - a.count);
  }, [stats]);

  const handleRefresh = () => {
    setStats(getPerfStats());
    setLastUpdated(new Date());
  };

  const handleClear = () => {
    clearPerfStats();
    setStats(getPerfStats());
    setLastUpdated(new Date());
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-slate-400">
          {t('settings.perfSubtitle')} {lastUpdated.toLocaleTimeString()}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={handleRefresh}>
            {t('settings.perfRefresh')}
          </Button>
          <Button variant="ghost" onClick={handleClear}>
            {t('settings.perfClear')}
          </Button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="text-sm text-slate-400">{t('settings.perfEmpty')}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-slate-300">
            <thead>
              <tr className="text-left text-slate-400">
                <th className="py-2 pr-4">{t('settings.perfMetric')}</th>
                <th className="py-2 pr-4">{t('settings.perfCount')}</th>
                <th className="py-2 pr-4">{t('settings.perfErrors')}</th>
                <th className="py-2 pr-4">{t('settings.perfErrorRate')}</th>
                <th className="py-2 pr-4">{t('settings.perfP50')}</th>
                <th className="py-2 pr-4">{t('settings.perfP95')}</th>
                <th className="py-2">{t('settings.perfLast')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.name} className="border-t border-slate-700/60">
                  <td className="py-2 pr-4 font-medium text-slate-200">{row.name}</td>
                  <td className="py-2 pr-4">{row.count}</td>
                  <td className="py-2 pr-4">{row.errorCount}</td>
                  <td className="py-2 pr-4">{formatRate(row.errorCount, row.count)}</td>
                  <td className="py-2 pr-4">{formatMs(row.p50)}</td>
                  <td className="py-2 pr-4">{formatMs(row.p95)}</td>
                  <td className="py-2">
                    {row.lastAt ? new Date(row.lastAt).toLocaleString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
