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
  onSave,
  onCancel,
}) => {
  const [provider, setProvider] = useState<LLMProvider>(
    initialData?.provider || 'deepseek'
  );
  const [apiKey, setApiKey] = useState(initialData?.apiKey || '');
  const [model, setModel] = useState(
    initialData?.model || PROVIDER_INFO[initialData?.provider || 'deepseek'].defaultModel
  );
  const [baseUrl, setBaseUrl] = useState(
    initialData?.baseUrl || PROVIDER_INFO[initialData?.provider || 'deepseek'].defaultUrl
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleProviderChange = (newProvider: LLMProvider) => {
    setProvider(newProvider);
    setModel(PROVIDER_INFO[newProvider].defaultModel);
    setBaseUrl(PROVIDER_INFO[newProvider].defaultUrl);
    setErrors({});
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate API key (skip for Ollama)
    if (provider !== 'ollama') {
      const apiKeyValidation = validateAPIKey(apiKey, provider);
      if (!apiKeyValidation.valid) {
        newErrors.apiKey = apiKeyValidation.error || 'Invalid API key';
      }
    }

    // Validate model name
    const modelValidation = validateModelName(model, provider);
    if (!modelValidation.valid) {
      newErrors.model = modelValidation.error || 'Invalid model name';
    }

    // Validate base URL if provided
    if (baseUrl) {
      const urlValidation = validateURL(baseUrl);
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
      apiKey,
      model,
      baseUrl,
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
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={`Enter your ${PROVIDER_INFO[provider].name} API key`}
          error={errors.apiKey}
          helperText="Your API key is stored locally and never sent to our servers"
          fullWidth
          required
        />
      )}

      {/* Model Name */}
      <Input
        label="Model Name"
        type="text"
        value={model}
        onChange={(e) => setModel(e.target.value)}
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
        value={baseUrl}
        onChange={(e) => setBaseUrl(e.target.value)}
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
