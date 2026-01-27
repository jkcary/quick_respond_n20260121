/**
 * APITester component - Test backend LLM connection
 */

import React, { useState } from 'react';
import type { LLMProvider } from '@/types';
import { Button } from '@/components/common';
import { BackendLLMGateway } from '@/core/backend/llmGateway';
import { isBackendAuthConfigured } from '@/core/backend/client';
import { useI18n } from '@/i18n';

export interface APITesterProps {
  provider: LLMProvider;
  model?: string;
}

export const APITester: React.FC<APITesterProps> = ({ provider, model }) => {
  const { t } = useI18n();
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    latency?: number;
    error?: string;
  } | null>(null);

  const backendReady = isBackendAuthConfigured();

  const handleTest = async () => {
    setTesting(true);
    setResult(null);

    try {
      const gateway = new BackendLLMGateway(provider, model);
      const testResult = await gateway.testConnection();

      setResult({
        success: testResult.success,
        latency: testResult.latency,
        error: testResult.error,
      });
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-slate-200">{t('settings.connectionTitle')}</h3>
          <p className="text-sm text-slate-400 mt-1">
            {t('settings.connectionSubtitleBackend')}
          </p>
        </div>
        <Button
          onClick={handleTest}
          disabled={testing || !backendReady}
          loading={testing}
          variant="secondary"
        >
          {t('settings.connectionTest')}
        </Button>
      </div>

      {/* Result */}
      {result && (
        <div
          className={`p-4 rounded-lg border ${
            result.success
              ? 'bg-green-900/20 border-green-700'
              : 'bg-red-900/20 border-red-700'
          }`}
        >
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="flex-shrink-0">
              {result.success ? (
                <svg
                  className="w-6 h-6 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
            </div>

            {/* Message */}
            <div className="flex-1">
              <div
                className={`font-medium ${
                  result.success ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {result.success ? t('settings.connectionSuccess') : t('settings.connectionFail')}
              </div>

              {result.success && result.latency !== undefined && (
                <div className="text-sm text-slate-300 mt-1">
                  {t('settings.connectionLatency', { ms: result.latency })}
                </div>
              )}

              {result.error && (
                <div className="text-sm text-red-300 mt-1">
                  {t('settings.connectionError', { error: result.error })}
                </div>
              )}

              {result.success && (
                <div className="text-sm text-slate-400 mt-2">
                  {t('settings.connectionSuccessHintBackend')}
                </div>
              )}

              {!result.success && (
                <div className="text-sm text-slate-400 mt-2">
                  {t('settings.connectionFailHintBackend')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!backendReady && (
        <div className="p-4 rounded-lg bg-yellow-900/20 border border-yellow-700">
          <div className="flex items-start gap-3">
            <svg
              className="w-6 h-6 text-yellow-400 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <div className="font-medium text-yellow-400">
                {t('settings.backendAuthRequired')}
              </div>
              <div className="text-sm text-slate-400 mt-1">
                {t('settings.backendAuthRequiredHint')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
