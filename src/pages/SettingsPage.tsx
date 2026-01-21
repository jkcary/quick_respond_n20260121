/**
 * Settings Page - Configuration Interface
 * Allows users to set grade level and API credentials
 */

import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';

const SettingsPage = () => {
  const config = useAppStore((state) => state.config);
  const updateConfig = useAppStore((state) => state.updateConfig);

  const [formData, setFormData] = useState(config);
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const providers = [
    { value: 'deepseek', label: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1' },
    { value: 'openai', label: 'OpenAI', baseUrl: 'https://api.openai.com/v1' },
    { value: 'custom', label: 'Custom Provider', baseUrl: '' },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card-cyber animate-slide-up">
        <h2 className="text-3xl mb-4">Settings</h2>
        <p className="text-cyber-secondary mb-6">
          Configure your learning experience
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Grade Level */}
          <div>
            <label className="block text-cyber-primary font-medium mb-2">
              Grade Level
            </label>
            <select
              value={formData.gradeLevel}
              onChange={(e) =>
                setFormData({ ...formData, gradeLevel: Number(e.target.value) })
              }
              className="input-cyber"
            >
              {[3, 4, 5, 6, 7, 8, 9].map((grade) => (
                <option key={grade} value={grade}>
                  Grade {grade}
                </option>
              ))}
            </select>
            <p className="text-sm text-cyber-secondary mt-2">
              Select your current grade to get appropriate vocabulary
            </p>
          </div>

          {/* API Provider */}
          <div>
            <label className="block text-cyber-primary font-medium mb-2">
              LLM Provider
            </label>
            <select
              value={formData.apiProvider}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  apiProvider: e.target.value as any,
                  apiBaseUrl:
                    providers.find((p) => p.value === e.target.value)
                      ?.baseUrl || '',
                })
              }
              className="input-cyber"
            >
              {providers.map((provider) => (
                <option key={provider.value} value={provider.value}>
                  {provider.label}
                </option>
              ))}
            </select>
          </div>

          {/* API Key */}
          <div>
            <label className="block text-cyber-primary font-medium mb-2">
              API Key
            </label>
            <input
              type="password"
              value={formData.apiKey}
              onChange={(e) =>
                setFormData({ ...formData, apiKey: e.target.value })
              }
              placeholder="sk-..."
              className="input-cyber"
            />
            <p className="text-sm text-cyber-secondary mt-2">
              Your API key is stored locally and never shared
            </p>
          </div>

          {/* Custom Base URL */}
          {formData.apiProvider === 'custom' && (
            <div>
              <label className="block text-cyber-primary font-medium mb-2">
                Custom Base URL
              </label>
              <input
                type="url"
                value={formData.apiBaseUrl || ''}
                onChange={(e) =>
                  setFormData({ ...formData, apiBaseUrl: e.target.value })
                }
                placeholder="https://api.example.com/v1"
                className="input-cyber"
              />
            </div>
          )}

          {/* Voice Settings */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.voiceEnabled}
                onChange={(e) =>
                  setFormData({ ...formData, voiceEnabled: e.target.checked })
                }
                className="w-5 h-5 rounded bg-cyber-bg border-cyber-primary text-cyber-primary focus:ring-cyber-primary"
              />
              <span className="text-cyber-primary">Enable Voice Synthesis</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.autoPlayPronunciation}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    autoPlayPronunciation: e.target.checked,
                  })
                }
                className="w-5 h-5 rounded bg-cyber-bg border-cyber-primary text-cyber-primary focus:ring-cyber-primary"
              />
              <span className="text-cyber-primary">
                Auto-play Pronunciation
              </span>
            </label>
          </div>

          {/* Save Button */}
          <div className="flex items-center gap-4">
            <button type="submit" className="btn-cyber flex-1">
              Save Configuration
            </button>
            {saved && (
              <span className="text-cyber-primary animate-slide-up">✓ Saved!</span>
            )}
          </div>
        </form>

        {/* Info Box */}
        <div className="mt-8 bg-cyber-bg rounded-lg p-4">
          <h3 className="text-cyber-primary font-medium mb-2">
            Recommended Providers
          </h3>
          <ul className="text-sm text-cyber-secondary space-y-1">
            <li>• DeepSeek: Cost-effective, fast responses</li>
            <li>• OpenAI: High accuracy, natural feedback</li>
            <li>• Custom: Use your own compatible API endpoint</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
