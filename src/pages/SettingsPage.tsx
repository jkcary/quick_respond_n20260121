/**
 * Settings Page - Configuration interface
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { Card, Button } from '@/components/common';
import { GradeSelector, LLMConfigForm, APITester, type LLMFormData } from '@/components/config';
import { toast } from '@/components/common';
import { LLMProvider, type GradeBook, type LLMConfig } from '@/types';
import { getGradeBookForGrade, getGradeBookLabel, parseGradeBook } from '@/types';

const DEFAULT_PROVIDER_SETTINGS: Record<LLMProvider, { model: string; baseUrl: string }> = {
  [LLMProvider.DeepSeek]: {
    model: 'deepseek-chat',
    baseUrl: 'https://api.deepseek.com',
  },
  [LLMProvider.OpenAI]: {
    model: 'gpt-3.5-turbo',
    baseUrl: 'https://api.openai.com',
  },
  [LLMProvider.Anthropic]: {
    model: 'claude-3-haiku-20240307',
    baseUrl: 'https://api.anthropic.com',
  },
  [LLMProvider.Moonshot]: {
    model: 'moonshot-v1-8k',
    baseUrl: 'https://api.moonshot.cn',
  },
  [LLMProvider.Ollama]: {
    model: 'llama2',
    baseUrl: 'http://localhost:11434',
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
  const navigate = useNavigate();
  const config = useAppStore((state) => state.config);
  const updateConfig = useAppStore((state) => state.updateConfig);

  const defaultGradeBook = config.gradeBook ?? getGradeBookForGrade(config.gradeLevel || 5);
  const [selectedGradeBook, setSelectedGradeBook] = useState<GradeBook>(defaultGradeBook);
  const [autoPlayAudio, setAutoPlayAudio] = useState(config.autoPlayPronunciation ?? true);

  const handleGradeChange = (gradeBook: GradeBook) => {
    const { grade } = parseGradeBook(gradeBook);
    setSelectedGradeBook(gradeBook);
    updateConfig({ gradeBook, gradeLevel: grade });
    toast.success(`Grade level updated to ${getGradeBookLabel(gradeBook)}`);
  };

  const handleLLMConfigSave = (data: LLMFormData) => {
    const existingConfigs = config.llmConfigs ?? ({} as Record<LLMProvider, LLMConfig>);
    const updatedConfigs: Record<LLMProvider, LLMConfig> = {
      ...existingConfigs,
      [data.provider]: {
        provider: data.provider,
        apiKey: data.apiKey,
        modelName: data.model,
        baseUrl: data.baseUrl,
        enabled: true,
      },
    };
    updateConfig({
      activeLLMProvider: data.provider,
      llmConfigs: updatedConfigs,
      apiProvider: data.provider as any,
      apiKey: data.apiKey,
      apiBaseUrl: data.baseUrl,
    });
    toast.success('LLM configuration saved');
  };

  const handleAutoPlayToggle = () => {
    const newValue = !autoPlayAudio;
    setAutoPlayAudio(newValue);
    updateConfig({ autoPlayPronunciation: newValue });
    toast.success(`Auto-play ${newValue ? 'enabled' : 'disabled'}`);
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

  if (!initialConfigs[legacyProvider] && (config.apiKey || config.apiBaseUrl)) {
    initialConfigs[legacyProvider] = {
      provider: legacyProvider,
      apiKey: config.apiKey || '',
      modelName: DEFAULT_PROVIDER_SETTINGS[legacyProvider].model,
      baseUrl: config.apiBaseUrl || DEFAULT_PROVIDER_SETTINGS[legacyProvider].baseUrl,
      enabled: true,
    };
  }

  const initialFormConfigs: Partial<Record<LLMProvider, Partial<LLMFormData>>> =
    (Object.entries(initialConfigs) as [LLMProvider, LLMConfig][]).reduce(
      (acc, [provider, cfg]) => {
        acc[provider] = {
          provider,
          apiKey: cfg.apiKey,
          model: cfg.modelName,
          baseUrl: cfg.baseUrl,
        };
        return acc;
      },
      {} as Partial<Record<LLMProvider, Partial<LLMFormData>>>
    );

  const currentLLMConfig: LLMConfig = {
    provider: activeProvider,
    apiKey: activeStoredConfig?.apiKey ?? config.apiKey ?? '',
    modelName: activeStoredConfig?.modelName ?? activeDefaults.model,
    enabled: activeStoredConfig?.enabled ?? true,
    baseUrl: activeStoredConfig?.baseUrl ?? config.apiBaseUrl ?? activeDefaults.baseUrl,
  };

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-cyan-400 mb-2">Settings</h1>
            <p className="text-slate-400">Configure your learning experience</p>
          </div>
          <Button variant="ghost" onClick={() => navigate('/')}>
            ← Back to Home
          </Button>
        </div>

        {/* Grade Level */}
        <Card>
          <h2 className="text-xl font-semibold text-slate-200 mb-4">
            Vocabulary Level
          </h2>
          <GradeSelector
            value={selectedGradeBook}
            onChange={handleGradeChange}
          />
        </Card>

        {/* LLM Configuration */}
        <Card>
          <h2 className="text-xl font-semibold text-slate-200 mb-4">
            LLM Provider
          </h2>
          <LLMConfigForm
            initialData={{
              provider: currentLLMConfig.provider,
              apiKey: currentLLMConfig.apiKey,
              model: currentLLMConfig.modelName,
              baseUrl: currentLLMConfig.baseUrl,
            }}
            initialConfigs={initialFormConfigs}
            onSave={handleLLMConfigSave}
          />
        </Card>

        {/* API Connection Test */}
        <Card>
          <APITester config={currentLLMConfig} />
        </Card>

        {/* Audio Settings */}
        <Card>
          <h2 className="text-xl font-semibold text-slate-200 mb-4">
            Audio Settings
          </h2>
          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer group">
              <div className="flex-1">
                <div className="text-slate-200 font-medium group-hover:text-cyan-400 transition">
                  Auto-play Pronunciation
                </div>
                <div className="text-sm text-slate-400 mt-1">
                  Automatically play word pronunciation when shown
                </div>
              </div>
              <button
                type="button"
                onClick={handleAutoPlayToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  autoPlayAudio ? 'bg-cyan-500' : 'bg-slate-700'
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
        <Card>
          <h2 className="text-xl font-semibold text-slate-200 mb-4">
            About
          </h2>
          <div className="space-y-2 text-sm text-slate-400">
            <p>
              <strong className="text-slate-300">English AI Agent</strong> - Version 1.0.0
            </p>
            <p>
              An intelligent vocabulary learning assistant powered by AI
            </p>
            <div className="pt-4 border-t border-slate-700 mt-4">
              <p className="text-slate-500 text-xs">
                Your data is stored locally and never sent to external servers.
                API keys are used only for LLM judgment requests.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
