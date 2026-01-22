/**
 * LLMConfigForm component - Provider configuration form
 */

import React, { useState } from 'react';
import type { LLMProvider } from '@/types';
import { Button, Input } from '@/components/common';
import { validateAPIKey, validateURL, validateModelName } from '@/utils/validators';

export interface LLMFormData {
  provider: LLMProvider;
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export interface LLMConfigFormProps {
  initialData?: Partial<LLMFormData>;
  initialConfigs?: Partial<Record<LLMProvider, Partial<LLMFormData>>>;
  onSave: (data: LLMFormData) => void;
  onCancel?: () => void;
}

const PROVIDER_INFO: Record<
  LLMProvider,
  { name: string; defaultModel: string; defaultUrl: string; description: string }
> = {
  deepseek: {
    name: 'DeepSeek',
    defaultModel: 'deepseek-chat',
    defaultUrl: 'https://api.deepseek.com',
    description: 'Fast and affordable Chinese LLM',
  },
  openai: {
    name: 'OpenAI',
    defaultModel: 'gpt-3.5-turbo',
    defaultUrl: 'https://api.openai.com',
    description: 'Industry-leading ChatGPT models',
  },
  anthropic: {
    name: 'Anthropic',
    defaultModel: 'claude-3-haiku-20240307',
    defaultUrl: 'https://api.anthropic.com',
    description: 'Claude models with strong reasoning',
  },
  moonshot: {
    name: 'Moonshot AI',
    defaultModel: 'moonshot-v1-8k',
    defaultUrl: 'https://api.moonshot.cn',
    description: 'Chinese AI with long context',
  },
  ollama: {
    name: 'Ollama',
    defaultModel: 'llama2',
    defaultUrl: 'http://localhost:11434',
    description: 'Self-hosted local models',
  },
};

export const LLMConfigForm: React.FC<LLMConfigFormProps> = ({
  initialData,
  initialConfigs,
  onSave,
  onCancel,
}) => {
  const [provider, setProvider] = useState<LLMProvider>(
    initialData?.provider || 'deepseek'
  );
  const [showApiKey, setShowApiKey] = useState(false);
  const [formByProvider, setFormByProvider] = useState(() => {
    const defaults = {} as Record<
      LLMProvider,
      { apiKey: string; model: string; baseUrl?: string }
    >;

    (Object.keys(PROVIDER_INFO) as LLMProvider[]).forEach((p) => {
      defaults[p] = {
        apiKey: '',
        model: PROVIDER_INFO[p].defaultModel,
        baseUrl: PROVIDER_INFO[p].defaultUrl,
      };
    });

    if (initialConfigs) {
      (Object.entries(initialConfigs) as [
        LLMProvider,
        Partial<LLMFormData>
      ][]).forEach(([p, config]) => {
        if (!config) {
          return;
        }
        defaults[p] = {
          ...defaults[p],
          apiKey: config.apiKey ?? defaults[p].apiKey,
          model: config.model ?? defaults[p].model,
          baseUrl: config.baseUrl ?? defaults[p].baseUrl,
        };
      });
    }

    if (initialData?.provider) {
      const p = initialData.provider;
      defaults[p] = {
        ...defaults[p],
        apiKey: initialData.apiKey ?? defaults[p].apiKey,
        model: initialData.model ?? defaults[p].model,
        baseUrl: initialData.baseUrl ?? defaults[p].baseUrl,
      };
    }

    return defaults;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const currentForm = formByProvider[provider];

  const handleProviderChange = (newProvider: LLMProvider) => {
    setProvider(newProvider);
    setErrors({});
    setShowApiKey(false);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate API key (skip for Ollama)
    if (provider !== 'ollama') {
      const apiKeyValidation = validateAPIKey(currentForm.apiKey, provider);
      if (!apiKeyValidation.valid) {
        newErrors.apiKey = apiKeyValidation.error || 'Invalid API key';
      }
    }

    // Validate model name
    const modelValidation = validateModelName(currentForm.model, provider);
    if (!modelValidation.valid) {
      newErrors.model = modelValidation.error || 'Invalid model name';
    }

    // Validate base URL if provided
    if (currentForm.baseUrl) {
      const urlValidation = validateURL(currentForm.baseUrl);
      if (!urlValidation.valid) {
        newErrors.baseUrl = urlValidation.error || 'Invalid URL';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    onSave({
      provider,
      apiKey: currentForm.apiKey,
      model: currentForm.model,
      baseUrl: currentForm.baseUrl,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Provider tabs */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-3">
          Select Provider
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {(Object.keys(PROVIDER_INFO) as LLMProvider[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => handleProviderChange(p)}
              className={`p-3 rounded-lg border transition-all ${
                provider === p
                  ? 'bg-cyan-500 border-cyan-400 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <div className="font-medium">{PROVIDER_INFO[p].name}</div>
              <div className="text-xs mt-1 opacity-80">
                {PROVIDER_INFO[p].description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* API Key (skip for Ollama) */}
      {provider !== 'ollama' && (
        <Input
          label="API Key"
          type={showApiKey ? 'text' : 'password'}
          value={currentForm.apiKey}
          onChange={(e) =>
            setFormByProvider((prev) => ({
              ...prev,
              [provider]: { ...prev[provider], apiKey: e.target.value },
            }))
          }
          placeholder={`Enter your ${PROVIDER_INFO[provider].name} API key`}
          error={errors.apiKey}
          helperText="Your API key is stored locally and never sent to our servers"
          rightElement={
            <button
              type="button"
              onClick={() => setShowApiKey((prev) => !prev)}
              className="p-1 text-slate-300 transition-colors hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900 rounded"
              aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
              aria-pressed={showApiKey}
            >
              {showApiKey ? (
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
          required
        />
      )}

      {/* Model Name */}
      <Input
        label="Model Name"
        type="text"
        value={currentForm.model}
        onChange={(e) =>
          setFormByProvider((prev) => ({
            ...prev,
            [provider]: { ...prev[provider], model: e.target.value },
          }))
        }
        placeholder={PROVIDER_INFO[provider].defaultModel}
        error={errors.model}
        helperText={`Default: ${PROVIDER_INFO[provider].defaultModel}`}
        fullWidth
        required
      />

      {/* Base URL (optional) */}
      <Input
        label="Base URL (Optional)"
        type="text"
        value={currentForm.baseUrl || ''}
        onChange={(e) =>
          setFormByProvider((prev) => ({
            ...prev,
            [provider]: { ...prev[provider], baseUrl: e.target.value },
          }))
        }
        placeholder={PROVIDER_INFO[provider].defaultUrl}
        error={errors.baseUrl}
        helperText="Leave default unless using a proxy or custom endpoint"
        fullWidth
      />

      {/* Actions */}
      <div className="flex gap-3">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} fullWidth>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="primary" fullWidth>
          Save Configuration
        </Button>
      </div>
    </form>
  );
};
