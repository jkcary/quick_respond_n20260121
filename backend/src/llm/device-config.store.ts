import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import fs from 'fs';
import path from 'path';
import { LlmProvider } from './llm.types';

type ProviderConfigEntry = {
  apiKey?: string;
  baseUrl?: string;
  keyUpdatedAt?: string;
  baseUrlUpdatedAt?: string;
};

type DeviceConfigEntry = {
  providers: Partial<Record<LlmProvider, ProviderConfigEntry>>;
};

type DeviceConfigStoreData = {
  version: 1;
  updatedAt: string;
  devices: Record<string, DeviceConfigEntry>;
};

export type LlmConfigStatus = {
  provider: LlmProvider;
  hasKey: boolean;
  hasBaseUrl: boolean;
  keyUpdatedAt?: string;
  baseUrlUpdatedAt?: string;
};

const defaultStoreData = (): DeviceConfigStoreData => ({
  version: 1,
  updatedAt: new Date().toISOString(),
  devices: {},
});

@Injectable()
export class DeviceConfigStore {
  private readonly logger = new Logger(DeviceConfigStore.name);
  private readonly storePath: string;
  private data: DeviceConfigStoreData = defaultStoreData();

  constructor(@Inject(ConfigService) configService: ConfigService) {
    const configured = (configService.get<string>('LLM_CONFIG_STORE_PATH') ?? '').trim();
    this.storePath =
      configured.length > 0
        ? configured
        : path.join(process.cwd(), 'data', 'device-llm-config.json');
    this.loadFromDisk();
  }

  getApiKey(deviceId: string | undefined, provider: LlmProvider): string | undefined {
    if (!deviceId) {
      return undefined;
    }
    return this.data.devices[deviceId]?.providers?.[provider]?.apiKey;
  }

  getBaseUrl(deviceId: string | undefined, provider: LlmProvider): string | undefined {
    if (!deviceId) {
      return undefined;
    }
    return this.data.devices[deviceId]?.providers?.[provider]?.baseUrl;
  }

  setApiKey(deviceId: string, provider: LlmProvider, apiKey: string): void {
    if (!deviceId) {
      return;
    }
    const entry = this.ensureEntry(deviceId, provider);
    if (!apiKey) {
      delete entry.apiKey;
      delete entry.keyUpdatedAt;
    } else {
      entry.apiKey = apiKey;
      entry.keyUpdatedAt = new Date().toISOString();
    }
    this.persist();
  }

  setBaseUrl(deviceId: string, provider: LlmProvider, baseUrl: string): void {
    if (!deviceId) {
      return;
    }
    const entry = this.ensureEntry(deviceId, provider);
    if (!baseUrl) {
      delete entry.baseUrl;
      delete entry.baseUrlUpdatedAt;
    } else {
      entry.baseUrl = baseUrl;
      entry.baseUrlUpdatedAt = new Date().toISOString();
    }
    this.persist();
  }

  getStatus(deviceId: string | undefined, provider?: LlmProvider): LlmConfigStatus[] {
    const providers = provider ? [provider] : (Object.values(LlmProvider) as LlmProvider[]);
    return providers.map((item) => {
      const entry = deviceId ? this.data.devices[deviceId]?.providers?.[item] : undefined;
      return {
        provider: item,
        hasKey: Boolean(entry?.apiKey),
        hasBaseUrl: Boolean(entry?.baseUrl),
        keyUpdatedAt: entry?.keyUpdatedAt,
        baseUrlUpdatedAt: entry?.baseUrlUpdatedAt,
      };
    });
  }

  private ensureEntry(deviceId: string, provider: LlmProvider): ProviderConfigEntry {
    const device = this.data.devices[deviceId] ?? { providers: {} };
    if (!this.data.devices[deviceId]) {
      this.data.devices[deviceId] = device;
    }
    const providers = device.providers ?? {};
    if (!device.providers) {
      device.providers = providers;
    }
    const entry = providers[provider] ?? {};
    if (!providers[provider]) {
      providers[provider] = entry;
    }
    return entry;
  }

  private loadFromDisk(): void {
    try {
      if (!fs.existsSync(this.storePath)) {
        return;
      }
      const raw = fs.readFileSync(this.storePath, 'utf-8');
      const parsed = JSON.parse(raw) as DeviceConfigStoreData;
      if (!parsed || typeof parsed !== 'object' || !parsed.devices) {
        return;
      }
      this.data = {
        version: 1,
        updatedAt: parsed.updatedAt ?? new Date().toISOString(),
        devices: parsed.devices ?? {},
      };
    } catch (error) {
      this.logger.warn('Failed to load LLM config store.');
      this.logger.debug(error instanceof Error ? error.message : String(error));
      this.data = defaultStoreData();
    }
  }

  private persist(): void {
    try {
      this.data.updatedAt = new Date().toISOString();
      const dir = path.dirname(this.storePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const payload = JSON.stringify(this.data, null, 2);
      const tempPath = `${this.storePath}.tmp`;
      fs.writeFileSync(tempPath, payload, 'utf-8');
      fs.renameSync(tempPath, this.storePath);
    } catch (error) {
      this.logger.warn('Failed to persist LLM config store.');
      this.logger.debug(error instanceof Error ? error.message : String(error));
    }
  }
}
