/**
 * ExportPanel component - Export error log functionality
 */

import React, { useState } from 'react';
import type { ErrorLog } from '@/types';
import { Button } from '@/components/common';
import { toast } from '@/components/common';
import { useI18n } from '@/i18n';

export interface ExportPanelProps {
  errorLog: ErrorLog;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({ errorLog }) => {
  const { t } = useI18n();
  const [exporting, setExporting] = useState(false);

  const handleExportJSON = () => {
    try {
      setExporting(true);

      const jsonString = JSON.stringify(errorLog, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `error-log-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      toast.success(t('export.toastExportSuccess'));
    } catch (error) {
      console.error('Export failed:', error);
      toast.error(t('export.toastExportFail'));
    } finally {
      setExporting(false);
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      const jsonString = JSON.stringify(errorLog, null, 2);
      await navigator.clipboard.writeText(jsonString);
      toast.success(t('export.toastCopySuccess'));
    } catch (error) {
      console.error('Copy failed:', error);
      toast.error(t('export.toastCopyFail'));
    }
  };

  const errorCount = Object.keys(errorLog.entries).length;
  const unmasteredCount = Object.values(errorLog.entries).filter(
    (e) => !e.mastered
  ).length;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-slate-200 mb-2">{t('export.title')}</h3>
        <p className="text-sm text-slate-400">
          {t('export.subtitle')}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="text-2xl font-bold text-cyan-400">{errorCount}</div>
          <div className="text-sm text-slate-400">{t('export.statsTotalWords')}</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="text-2xl font-bold text-yellow-400">{unmasteredCount}</div>
          <div className="text-sm text-slate-400">{t('export.statsToPractice')}</div>
        </div>
      </div>

      {/* Export buttons */}
      <div className="space-y-2">
        <Button
          onClick={handleExportJSON}
          disabled={exporting || errorCount === 0}
          loading={exporting}
          variant="primary"
          fullWidth
        >
          <svg
            className="w-5 h-5 mr-2 inline"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          {t('export.download')}
        </Button>

        <Button
          onClick={handleCopyToClipboard}
          disabled={errorCount === 0}
          variant="secondary"
          fullWidth
        >
          <svg
            className="w-5 h-5 mr-2 inline"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          {t('export.copy')}
        </Button>
      </div>

      {errorCount === 0 && (
        <div className="text-center py-6 text-slate-400 text-sm">
          {t('export.empty')}
        </div>
      )}

      {/* Info */}
      <div className="text-xs text-slate-400 bg-slate-800 p-3 rounded-lg border border-slate-700">
        <div className="font-medium mb-1">{t('export.formatTitle')}</div>
        <div>
          {t('export.formatDesc')}
        </div>
      </div>
    </div>
  );
};
