/**
 * LLMConfigForm component - Provider configuration form
 */

import React, { useState } from 'react';
import { LLMProvider } from '@/types';
import { Button, Input } from '@/components/common';
import { validateModelName } from '@/utils/validators';
import { useI18n } from '@/i18n';

export interface LLMFormData {
  provider: LLMProvider;
  model: string;
}

export interface LLMConfigFormProps {
  initialData?: Partial<LLMFormData>;
  initialConfigs?: Partial<Record<LLMProvider, Partial<LLMFormData>>>;
  onSave: (data: LLMFormData) => void;
  onCancel?: () => void;
}

const PROVIDER_INFO: Record<LLMProvider, { name: string; defaultModel: string; description: string }> = {
  deepseek: {
    name: 'DeepSeek',
    defaultModel: 'deepseek-chat',
    description: 'Fast and affordable Chinese LLM',
  },
  openai: {
    name: 'OpenAI',
    defaultModel: 'gpt-3.5-turbo',
    description: 'Industry-leading ChatGPT models',
  },
  anthropic: {
    name: 'Anthropic',
    defaultModel: 'claude-3-haiku-20240307',
    description: 'Claude models with strong reasoning',
  },
  moonshot: {
    name: 'Moonshot AI',
    defaultModel: 'moonshot-v1-8k',
    description: 'Chinese AI with long context',
  },
  ollama: {
    name: 'Ollama',
    defaultModel: 'llama2',
    description: 'Self-hosted local models',
  },
};

export const LLMConfigForm: React.FC<LLMConfigFormProps> = ({
  initialData,
  initialConfigs,
  onSave,
  onCancel,
}) => {
  const { t } = useI18n();
  const [provider, setProvider] = useState<LLMProvider>(
    initialData?.provider || LLMProvider.DeepSeek,
  );
  const [formByProvider, setFormByProvider] = useState(() => {
    const defaults = {} as Record<LLMProvider, { model: string }>;

    (Object.keys(PROVIDER_INFO) as LLMProvider[]).forEach((p) => {
      defaults[p] = {
        model: PROVIDER_INFO[p].defaultModel,
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
          model: config.model ?? defaults[p].model,
        };
      });
    }

    if (initialData?.provider) {
      const p = initialData.provider;
      defaults[p] = {
        ...defaults[p],
        model: initialData.model ?? defaults[p].model,
      };
    }

    return defaults;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const currentForm = formByProvider[provider];

  const handleProviderChange = (newProvider: LLMProvider) => {
    setProvider(newProvider);
    setErrors({});
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    const modelValidation = validateModelName(currentForm.model, provider);
    if (!modelValidation.valid) {
      newErrors.model = modelValidation.error || 'Invalid model name';
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
      model: currentForm.model,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Provider tabs */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-3">
          {t('settings.providerSelect')}
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

      <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-3">
        <p className="text-xs text-white dark:text-slate-400">
          {t('settings.backendManagedHint')}
        </p>
      </div>

      {/* Model Name */}
      <Input
        label={t('settings.modelLabel')}
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
        helperText={t('settings.modelHelper', { model: PROVIDER_INFO[provider].defaultModel })}
        fullWidth
        required
      />

      {/* Actions */}
      <div className="flex gap-3">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} fullWidth>
            {t('settings.cancel')}
          </Button>
        )}
        <Button type="submit" variant="primary" fullWidth>
          {t('settings.save')}
        </Button>
      </div>
    </form>
  );
};
