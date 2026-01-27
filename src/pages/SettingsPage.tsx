/**
 * Settings Page - Configuration interface
 */

import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Card, Button, Input } from '@/components/common';
import { GradeSelector, LLMConfigForm, APITester, PerfDiagnostics, type LLMFormData } from '@/components/config';
import { toast } from '@/components/common';
import { LLMProvider, type GradeBook, type LLMConfig } from '@/types';
import { getGradeBookForGrade, getGradeBookLabel, parseGradeBook } from '@/types';
import { useI18n } from '@/i18n';
import {
  getBackendBaseUrl,
  resetBackendToken,
  setBackendBaseUrl,
  backendRequest,
} from '@/core/backend/client';
import { validateAPIKey, validateURL } from '@/utils/validators';

const DEFAULT_PROVIDER_SETTINGS: Record<LLMProvider, { model: string }> = {
  [LLMProvider.DeepSeek]: {
    model: 'deepseek-chat',
  },
  [LLMProvider.OpenAI]: {
    model: 'gpt-3.5-turbo',
  },
  [LLMProvider.Anthropic]: {
    model: 'claude-3-haiku-20240307',
  },
  [LLMProvider.Moonshot]: {
    model: 'moonshot-v1-8k',
  },
  [LLMProvider.Ollama]: {
    model: 'llama2',
  },
};

const normalizeProvider = (value?: string): LLMProvider => {
  switch (value) {
    case LLMProvider.DeepSeek:
    case LLMProvider.OpenAI:
    case LLMProvider.Anthropic:
    case LLMProvider.Moonshot:
    case LLMProvider.Ollama:
      return value;
    default:
      return LLMProvider.DeepSeek;
  }
};

const SettingsPage: React.FC = () => {
  const { t } = useI18n();
  const config = useAppStore((state) => state.config);
  const updateConfig = useAppStore((state) => state.updateConfig);

  const defaultGradeBook = config.gradeBook ?? getGradeBookForGrade(config.gradeLevel || 5);
  const [selectedGradeBook, setSelectedGradeBook] = useState<GradeBook>(defaultGradeBook);
  const [autoPlayAudio, setAutoPlayAudio] = useState(config.autoPlayPronunciation ?? true);
  const [backendUrlInput, setBackendUrlInput] = useState(getBackendBaseUrl());
  const [backendUrlError, setBackendUrlError] = useState<string | undefined>();
  const [llmKeyByProvider, setLlmKeyByProvider] = useState<Record<LLMProvider, string>>(() => ({
    [LLMProvider.DeepSeek]: '',
    [LLMProvider.OpenAI]: '',
    [LLMProvider.Anthropic]: '',
    [LLMProvider.Moonshot]: '',
    [LLMProvider.Ollama]: '',
  }));
  const [llmKeyError, setLlmKeyError] = useState<string | undefined>();
  const [showLlmKey, setShowLlmKey] = useState(false);
  const [llmBaseUrlByProvider, setLlmBaseUrlByProvider] = useState<Record<LLMProvider, string>>(() => {
    if (typeof window === 'undefined') {
      return {
        [LLMProvider.DeepSeek]: '',
        [LLMProvider.OpenAI]: '',
        [LLMProvider.Anthropic]: '',
        [LLMProvider.Moonshot]: '',
        [LLMProvider.Ollama]: '',
      };
    }
    const read = (provider: LLMProvider) =>
      window.localStorage.getItem(`eaa_llm_base_url_${provider}`) ?? '';
    return {
      [LLMProvider.DeepSeek]: read(LLMProvider.DeepSeek),
      [LLMProvider.OpenAI]: read(LLMProvider.OpenAI),
      [LLMProvider.Anthropic]: read(LLMProvider.Anthropic),
      [LLMProvider.Moonshot]: read(LLMProvider.Moonshot),
      [LLMProvider.Ollama]: read(LLMProvider.Ollama),
    };
  });
  const [llmBaseUrlError, setLlmBaseUrlError] = useState<string | undefined>();
  const [backendHealth, setBackendHealth] = useState<'unknown' | 'ok' | 'error'>('unknown');
  const [llmStatus, setLlmStatus] = useState<
    | {
        provider: LLMProvider;
        hasKey: boolean;
        hasBaseUrl: boolean;
        keyUpdatedAt?: string;
        baseUrlUpdatedAt?: string;
      }
    | null
  >(null);
  const [llmStatusError, setLlmStatusError] = useState<string | undefined>();

  const formatTimestamp = (value?: string) => {
    if (!value) {
      return '';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return date.toLocaleString();
  };

  const formatStatusLabel = (present: boolean | null, timestamp?: string) => {
    if (present === null) {
      return t('settings.statusUnknown');
    }
    if (!present) {
      return t('settings.statusMissing');
    }
    const formatted = formatTimestamp(timestamp);
    if (!formatted) {
      return t('settings.statusPresent');
    }
    return t('settings.statusPresentAt', { time: formatted });
  };

  const refreshBackendIndicators = async (provider: LLMProvider) => {
    try {
      await backendRequest('/health', { method: 'GET' }, { auth: false });
      setBackendHealth('ok');
    } catch {
      setBackendHealth('error');
    }

    try {
      const status = await backendRequest<
        Array<{
          provider: LLMProvider;
          hasKey: boolean;
          hasBaseUrl: boolean;
          keyUpdatedAt?: string;
          baseUrlUpdatedAt?: string;
        }>
      >(`/llm/status?provider=${provider}`);
      setLlmStatus(status[0] ?? null);
      setLlmStatusError(undefined);
    } catch (error) {
      setLlmStatus(null);
      setLlmStatusError(error instanceof Error ? error.message : t('settings.statusUnknownError'));
    }
  };

  const handleGradeChange = (gradeBook: GradeBook) => {
    const { grade } = parseGradeBook(gradeBook);
    setSelectedGradeBook(gradeBook);
    updateConfig({ gradeBook, gradeLevel: grade });
    toast.success(t('settings.toastGradeUpdated', { grade: getGradeBookLabel(gradeBook) }));
  };

  const handleLLMConfigSave = (data: LLMFormData) => {
    const existingConfigs = config.llmConfigs ?? ({} as Record<LLMProvider, LLMConfig>);
    const updatedConfigs: Record<LLMProvider, LLMConfig> = {
      ...existingConfigs,
      [data.provider]: {
        provider: data.provider,
        apiKey: '',
        modelName: data.model,
        baseUrl: existingConfigs[data.provider]?.baseUrl,
        enabled: true,
      },
    };
    updateConfig({
      activeLLMProvider: data.provider,
      llmConfigs: updatedConfigs,
      apiProvider: data.provider as any,
      apiKey: '',
    });
    toast.success(t('settings.toastLlmSaved'));
  };

  const handleReconnect = () => {
    resetBackendToken();
    void refreshBackendIndicators(activeProvider);
    toast.success(t('settings.backendReconnectToast'));
  };

  const handleBackendUrlSave = () => {
    const trimmed = backendUrlInput.trim();
    if (trimmed.length === 0) {
      setBackendBaseUrl('');
      resetBackendToken();
      setBackendUrlError(undefined);
      setBackendUrlInput(getBackendBaseUrl());
      void refreshBackendIndicators(activeProvider);
      toast.success(t('settings.backendUrlReset'));
      return;
    }

    const validation = validateURL(trimmed);
    if (!validation.valid) {
      setBackendUrlError(validation.error || t('settings.backendUrlInvalid'));
      return;
    }
    setBackendBaseUrl(trimmed);
    resetBackendToken();
    setBackendUrlError(undefined);
    setBackendUrlInput(getBackendBaseUrl());
    void refreshBackendIndicators(activeProvider);
    toast.success(t('settings.backendUrlSaved'));
  };

  const handleAutoPlayToggle = () => {
    const newValue = !autoPlayAudio;
    setAutoPlayAudio(newValue);
    updateConfig({ autoPlayPronunciation: newValue });
    toast.success(newValue ? t('settings.toastAutoPlayOn') : t('settings.toastAutoPlayOff'));
  };

  const legacyProvider = normalizeProvider(config.apiProvider);
  const activeProvider = normalizeProvider(
    config.activeLLMProvider ?? config.apiProvider
  );
  const activeDefaults = DEFAULT_PROVIDER_SETTINGS[activeProvider];
  const activeStoredConfig = config.llmConfigs?.[activeProvider];

  const initialConfigs = { ...(config.llmConfigs ?? {}) } as Record<
    LLMProvider,
    LLMConfig
  >;

  if (!initialConfigs[legacyProvider] && config.apiKey) {
    initialConfigs[legacyProvider] = {
      provider: legacyProvider,
      apiKey: '',
      modelName: DEFAULT_PROVIDER_SETTINGS[legacyProvider].model,
      baseUrl: undefined,
      enabled: true,
    };
  }

  const initialFormConfigs: Partial<Record<LLMProvider, Partial<LLMFormData>>> =
    (Object.entries(initialConfigs) as [LLMProvider, LLMConfig][]).reduce(
      (acc, [provider, cfg]) => {
        acc[provider] = {
          provider,
          model: cfg.modelName,
        };
        return acc;
      },
      {} as Partial<Record<LLMProvider, Partial<LLMFormData>>>
    );

  const currentLLMConfig: LLMConfig = {
    provider: activeProvider,
    apiKey: '',
    modelName: activeStoredConfig?.modelName ?? activeDefaults.model,
    enabled: activeStoredConfig?.enabled ?? true,
    baseUrl: activeStoredConfig?.baseUrl,
  };

  const currentKeyValue = llmKeyByProvider[activeProvider] ?? '';
  const currentBaseUrlValue = llmBaseUrlByProvider[activeProvider] ?? '';

  useEffect(() => {
    void refreshBackendIndicators(activeProvider);
  }, [activeProvider]);

  const handleLlmKeySave = async () => {
    const trimmed = currentKeyValue.trim();

    if (trimmed.length > 0 && activeProvider !== LLMProvider.Ollama) {
      const validation = validateAPIKey(trimmed, activeProvider);
      if (!validation.valid) {
        setLlmKeyError(validation.error || t('settings.llmKeyInvalid'));
        return;
      }
    }

    try {
      await backendRequest('/llm/key', {
        method: 'POST',
        body: JSON.stringify({
          provider: activeProvider,
          apiKey: trimmed,
        }),
      });
      setLlmKeyError(undefined);
      setLlmKeyByProvider((prev) => ({ ...prev, [activeProvider]: '' }));
      void refreshBackendIndicators(activeProvider);
      toast.success(trimmed ? t('settings.llmKeySaved') : t('settings.llmKeyCleared'));
    } catch (error) {
      toast.error(
        t('settings.llmKeySaveFail', {
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
    }
  };

  const handleLlmBaseUrlSave = async () => {
    const trimmed = currentBaseUrlValue.trim();

    if (trimmed.length > 0) {
      const validation = validateURL(trimmed);
      if (!validation.valid) {
        setLlmBaseUrlError(validation.error || t('settings.llmBaseUrlInvalid'));
        return;
      }
    }

    try {
      await backendRequest('/llm/base-url', {
        method: 'POST',
        body: JSON.stringify({
          provider: activeProvider,
          baseUrl: trimmed,
        }),
      });
      setLlmBaseUrlError(undefined);
      if (typeof window !== 'undefined') {
        const key = `eaa_llm_base_url_${activeProvider}`;
        if (!trimmed) {
          window.localStorage.removeItem(key);
        } else {
          window.localStorage.setItem(key, trimmed);
        }
      }
      void refreshBackendIndicators(activeProvider);
      toast.success(trimmed ? t('settings.llmBaseUrlSaved') : t('settings.llmBaseUrlCleared'));
    } catch (error) {
      toast.error(
        t('settings.llmBaseUrlSaveFail', {
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-accent mb-2">{t('settings.title')}</h1>
            <p className="text-text-muted">{t('settings.subtitle')}</p>
          </div>
        </div>

        {/* Grade Level */}
        <Card className="animate-slide-up">
          <h2 className="text-xl font-semibold text-text-primary mb-4">
            {t('settings.sectionVocabulary')}
          </h2>
          <GradeSelector
            value={selectedGradeBook}
            onChange={handleGradeChange}
          />
        </Card>

        {/* LLM Configuration */}
        <Card className="animate-slide-up">
          <h2 className="text-xl font-semibold text-text-primary mb-4">
            {t('settings.sectionLlm')}
          </h2>
          <div className="mb-4 rounded-lg border border-border-primary bg-bg-secondary/40 p-3">
            <div className="space-y-4">
              <Input
                label={t('settings.backendUrlLabel')}
                value={backendUrlInput}
                onChange={(e) => {
                  setBackendUrlInput(e.target.value);
                  setBackendUrlError(undefined);
                }}
                error={backendUrlError}
                helperText={t('settings.backendUrlHelper')}
                placeholder={t('settings.backendUrlPlaceholder')}
                fullWidth
              />
              <Input
                label={t('settings.llmBaseUrlLabel')}
                value={currentBaseUrlValue}
                onChange={(e) => {
                  const value = e.target.value;
                  setLlmBaseUrlByProvider((prev) => ({ ...prev, [activeProvider]: value }));
                  setLlmBaseUrlError(undefined);
                }}
                error={llmBaseUrlError}
                helperText={t('settings.llmBaseUrlHelper', { provider: activeProvider })}
                placeholder={t('settings.llmBaseUrlPlaceholder', { provider: activeProvider })}
                fullWidth
              />
              <Input
                label={t('settings.llmKeyLabel')}
                type={showLlmKey ? 'text' : 'password'}
                value={currentKeyValue}
                onChange={(e) => {
                  const value = e.target.value;
                  setLlmKeyByProvider((prev) => ({ ...prev, [activeProvider]: value }));
                  setLlmKeyError(undefined);
                }}
                error={llmKeyError}
                helperText={t('settings.llmKeyHelper', { provider: activeProvider })}
                placeholder={t('settings.llmKeyPlaceholder', { provider: activeProvider })}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowLlmKey((prev) => !prev)}
                    className="p-1 text-slate-300 transition-colors hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900 rounded"
                    aria-label={showLlmKey ? t('settings.llmKeyHide') : t('settings.llmKeyShow')}
                    aria-pressed={showLlmKey}
                  >
                    {showLlmKey ? (
                      <svg
                        className="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7.25 20 3.15 16.98 1 12c.7-1.61 1.75-3.11 3.12-4.37" />
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                        <path d="M6.1 6.1 3 3" />
                        <path d="M21 21 18.9 18.9" />
                        <path d="M14.12 9.88a3 3 0 0 0-4.24 0" />
                        <path d="M9.88 14.12a3 3 0 0 0 4.24 0" />
                        <path d="M3.12 7.63A10.94 10.94 0 0 1 12 4c4.75 0 8.85 3.02 11 8a10.6 10.6 0 0 1-2.6 4.4" />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M2.46 12C4.2 7.94 7.85 5 12 5c4.15 0 7.8 2.94 9.54 7-1.74 4.06-5.39 7-9.54 7-4.15 0-7.8-2.94-9.54-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                }
                fullWidth
              />
              <div className="flex flex-wrap gap-3">
                <Button variant="secondary" onClick={handleBackendUrlSave}>
                  {t('settings.backendUrlSave')}
                </Button>
                <Button variant="secondary" onClick={handleLlmBaseUrlSave}>
                  {t('settings.llmBaseUrlSave')}
                </Button>
                <Button variant="secondary" onClick={handleLlmKeySave}>
                  {t('settings.llmKeySave')}
                </Button>
                <Button variant="ghost" onClick={handleReconnect}>
                  {t('settings.backendReconnect')}
                </Button>
              </div>
              <div className="mt-2 space-y-2 text-xs text-text-muted">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      backendHealth === 'ok'
                        ? 'bg-emerald-400'
                        : backendHealth === 'error'
                          ? 'bg-rose-400'
                          : 'bg-slate-500'
                    }`}
                  />
                  <span>
                    {t('settings.backendStatusLabel')}{' '}
                    {backendHealth === 'ok'
                      ? t('settings.backendStatusConnected')
                      : backendHealth === 'error'
                        ? t('settings.backendStatusDisconnected')
                        : t('settings.backendStatusUnknown')}
                  </span>
                </div>
                <div>
                  {t('settings.llmKeyStatusLabel')}{' '}
                  {formatStatusLabel(llmStatus ? llmStatus.hasKey : null, llmStatus?.keyUpdatedAt)}
                </div>
                <div>
                  {t('settings.llmBaseUrlStatusLabel')}{' '}
                  {formatStatusLabel(
                    llmStatus ? llmStatus.hasBaseUrl : null,
                    llmStatus?.baseUrlUpdatedAt,
                  )}
                </div>
                {llmStatusError ? (
                  <div className="text-rose-300">
                    {t('settings.statusLoadFail', { error: llmStatusError })}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
          <LLMConfigForm
            initialData={{
              provider: currentLLMConfig.provider,
              model: currentLLMConfig.modelName,
            }}
            initialConfigs={initialFormConfigs}
            onSave={handleLLMConfigSave}
          />
        </Card>

        {/* API Connection Test */}
        <Card className="animate-slide-up">
          <APITester provider={currentLLMConfig.provider} model={currentLLMConfig.modelName} />
        </Card>

        {/* Performance Diagnostics */}
        <Card className="animate-slide-up">
          <h2 className="text-xl font-semibold text-text-primary mb-4">
            {t('settings.sectionPerformance')}
          </h2>
          <PerfDiagnostics />
        </Card>

        {/* Audio Settings */}
        <Card className="animate-slide-up">
          <h2 className="text-xl font-semibold text-text-primary mb-4">
            {t('settings.sectionAudio')}
          </h2>
          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer group">
              <div className="flex-1">
                <div className="text-text-primary font-medium group-hover:text-accent transition">
                  {t('settings.autoPlayTitle')}
                </div>
                <div className="text-sm text-text-muted mt-1">
                  {t('settings.autoPlayDesc')}
                </div>
              </div>
              <button
                type="button"
                onClick={handleAutoPlayToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  autoPlayAudio ? 'bg-accent' : 'bg-bg-tertiary'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoPlayAudio ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </label>
          </div>
        </Card>

        {/* About */}
        <Card className="animate-slide-up">
          <h2 className="text-xl font-semibold text-text-primary mb-4">
            {t('settings.sectionAbout')}
          </h2>
          <div className="space-y-2 text-sm text-text-muted">
            <p>
              <strong className="text-text-secondary">{t('settings.aboutVersion')}</strong>
            </p>
            <p>
              {t('settings.aboutDesc')}
            </p>
            <div className="pt-4 border-t border-border-primary mt-4">
              <p className="text-text-muted text-xs">
                {t('settings.aboutPrivacy')}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
