const DEFAULT_BACKEND_ORIGIN = 'http://localhost:4000';
const DEVICE_ID_KEY = 'eaa_device_id';
const BACKEND_URL_KEY = 'eaa_backend_url';
const BACKEND_SECRET_KEY = 'eaa_backend_secret';
const DISCOVERED_PORT_KEY = 'eaa_discovered_port';

/** 请求超时时间（毫秒） */
const REQUEST_TIMEOUT_MS = 30_000;

/** 端口探测超时时间（毫秒） */
const PORT_PROBE_TIMEOUT_MS = 2_000;

/** 端口探测范围 */
const PORT_RANGE_START = 4000;
const PORT_RANGE_END = 4005;

/** 最大重试次数 */
const MAX_RETRIES = 3;

/** 初始重试延迟（毫秒） */
const INITIAL_RETRY_DELAY_MS = 1000;

const resolveBackendBaseUrl = (raw: string): string => {
  const trimmed = raw.trim().replace(/\/+$/, '');
  // 处理已包含 /api 的情况
  const withoutApi = trimmed.replace(/\/api\/?$/, '');
  return `${withoutApi}/api`;
};

const readStoredBackendUrl = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.localStorage.getItem(BACKEND_URL_KEY);
};

const readEnvBackendUrl = (): string => {
  return (import.meta.env.VITE_BACKEND_URL as string | undefined) ?? DEFAULT_BACKEND_ORIGIN;
};

export const getBackendBaseUrl = (): string => {
  // 优先使用用户手动配置的 URL
  const stored = readStoredBackendUrl();
  if (stored && stored.trim().length > 0) {
    return resolveBackendBaseUrl(stored);
  }

  // 其次使用已发现的端口
  const discoveredPort = getDiscoveredPort();
  if (discoveredPort) {
    return resolveBackendBaseUrl(`http://localhost:${discoveredPort}`);
  }

  // 回退到环境变量或默认值
  return resolveBackendBaseUrl(readEnvBackendUrl());
};

export const setBackendBaseUrl = (value: string): void => {
  if (typeof window === 'undefined') {
    return;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    window.localStorage.removeItem(BACKEND_URL_KEY);
    return;
  }
  window.localStorage.setItem(BACKEND_URL_KEY, trimmed);
};
const readEnvBackendSecret = (): string => {
  return (import.meta.env.VITE_BACKEND_SHARED_SECRET as string | undefined) ?? '';
};

const readStoredBackendSecret = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.localStorage.getItem(BACKEND_SECRET_KEY);
};

export const getBackendSharedSecret = (): string => {
  const stored = readStoredBackendSecret();
  const raw = stored && stored.trim().length > 0 ? stored : readEnvBackendSecret();
  return raw.trim();
};

export const setBackendSharedSecret = (value: string): void => {
  if (typeof window === 'undefined') {
    return;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    window.localStorage.removeItem(BACKEND_SECRET_KEY);
    return;
  }
  window.localStorage.setItem(BACKEND_SECRET_KEY, trimmed);
};

export const isBackendAuthConfigured = (): boolean => getBackendBaseUrl().length > 0;

/**
 * 探测单个端口是否有后端服务
 */
const probePort = async (port: number): Promise<boolean> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PORT_PROBE_TIMEOUT_MS);

  try {
    const response = await fetch(`http://localhost:${port}/api/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    clearTimeout(timeoutId);
    return false;
  }
};

/**
 * 读取已发现的端口
 */
const getDiscoveredPort = (): number | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  const stored = window.localStorage.getItem(DISCOVERED_PORT_KEY);
  return stored ? Number(stored) : null;
};

/**
 * 保存发现的端口
 */
const setDiscoveredPort = (port: number): void => {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(DISCOVERED_PORT_KEY, String(port));
};

/**
 * 清除发现的端口
 */
export const clearDiscoveredPort = (): void => {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.removeItem(DISCOVERED_PORT_KEY);
};

/**
 * 发现后端端口
 * 优先检查已发现的端口，然后按顺序探测 4000-4005
 * @returns 发现的端口号，如果未找到则返回 null
 */
export const discoverBackendPort = async (): Promise<number | null> => {
  // 如果用户手动配置了 URL，不进行端口发现
  const storedUrl = readStoredBackendUrl();
  if (storedUrl && storedUrl.trim().length > 0) {
    return null;
  }

  // 先检查已发现的端口是否仍然有效
  const cachedPort = getDiscoveredPort();
  if (cachedPort && await probePort(cachedPort)) {
    return cachedPort;
  }

  // 按顺序探测端口
  for (let port = PORT_RANGE_START; port <= PORT_RANGE_END; port++) {
    if (await probePort(port)) {
      setDiscoveredPort(port);
      return port;
    }
  }

  return null;
};

/**
 * 自动发现并设置后端 URL
 * 如果发现后端端口，自动更新 baseUrl
 * @returns 是否成功发现后端
 */
export const autoDiscoverBackend = async (): Promise<boolean> => {
  const port = await discoverBackendPort();
  if (port) {
    // 更新内部使用的 URL（通过 discovered port）
    setDiscoveredPort(port);
    return true;
  }
  return false;
};

const getDeviceId = (): string => {
  if (typeof window === 'undefined') {
    return 'server';
  }

  const existing = window.localStorage.getItem(DEVICE_ID_KEY);
  if (existing) {
    return existing;
  }

  const generated = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `device_${Date.now()}_${Math.random().toString(16).slice(2)}`;

  window.localStorage.setItem(DEVICE_ID_KEY, generated);
  return generated;
};

type TokenCache = {
  value: string;
  expiresAt: number;
};

let tokenCache: TokenCache | null = null;

/** Token 刷新锁，防止并发请求时多次刷新 */
let tokenRefreshPromise: Promise<TokenCache> | null = null;

const requestToken = async (): Promise<TokenCache> => {
  const sharedSecret = getBackendSharedSecret();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${getBackendBaseUrl()}/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId: getDeviceId(),
        sharedSecret,
      }),
      signal: controller.signal,
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.message ?? payload?.error ?? 'Failed to obtain token');
    }

    const accessToken = payload?.accessToken as string | undefined;
    const expiresIn = Number(payload?.expiresIn ?? 0);
    if (!accessToken) {
      throw new Error('Invalid token response');
    }

    const expiresAt = Date.now() + Math.max(expiresIn, 60) * 1000;
    return { value: accessToken, expiresAt };
  } finally {
    clearTimeout(timeoutId);
  }
};

export const getBackendToken = async (): Promise<string> => {
  // 检查缓存是否有效（提前 30 秒刷新）
  if (tokenCache && tokenCache.expiresAt - Date.now() > 30_000) {
    return tokenCache.value;
  }

  // 如果已有刷新请求在进行中，复用该 Promise（防止竞态条件）
  if (tokenRefreshPromise) {
    const result = await tokenRefreshPromise;
    return result.value;
  }

  // 创建新的刷新请求
  tokenRefreshPromise = requestToken();
  try {
    tokenCache = await tokenRefreshPromise;
    return tokenCache.value;
  } finally {
    tokenRefreshPromise = null;
  }
};

export const resetBackendToken = (): void => {
  tokenCache = null;
  tokenRefreshPromise = null;
};

export type BackendResponse<T> = {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
};

/** 延迟函数 */
const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/** 判断错误是否可重试 */
const isRetryableError = (error: unknown): boolean => {
  if (error instanceof Error) {
    // 网络错误、超时错误可重试
    if (error.name === 'AbortError' || error.message.includes('network') || error.message.includes('timeout')) {
      return true;
    }
  }
  return false;
};

/** 判断 HTTP 状态码是否可重试 */
const isRetryableStatus = (status: number): boolean => {
  // 5xx 服务器错误、408 请求超时、429 限流
  return status >= 500 || status === 408 || status === 429;
};

export type BackendRequestOptions = {
  auth?: boolean;
  timeout?: number;
  maxRetries?: number;
};

export async function backendRequest<T>(
  path: string,
  init: RequestInit = {},
  options: BackendRequestOptions = {},
): Promise<T> {
  const { auth = true, timeout = REQUEST_TIMEOUT_MS, maxRetries = MAX_RETRIES } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // 非首次尝试时，等待指数退避时间
    if (attempt > 0) {
      const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt - 1);
      await sleep(delay);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const headers = new Headers(init.headers ?? {});
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }

      if (auth) {
        const token = await getBackendToken();
        headers.set('Authorization', `Bearer ${token}`);
      }

      const baseUrl = getBackendBaseUrl();
      const url = path.startsWith('http')
        ? path
        : `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;

      const response = await fetch(url, {
        ...init,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const payload: BackendResponse<T> = await response.json().catch(() => ({} as BackendResponse<T>));

      // 401 未授权：清除 token 并重试一次
      if (response.status === 401 && attempt === 0) {
        resetBackendToken();
        lastError = new Error('Unauthorized - token expired');
        continue;
      }

      // 可重试的状态码
      if (isRetryableStatus(response.status) && attempt < maxRetries) {
        lastError = new Error(payload?.message ?? payload?.error ?? `Request failed (${response.status})`);
        continue;
      }

      if (!response.ok) {
        throw new Error(payload?.message ?? payload?.error ?? `Request failed (${response.status})`);
      }

      if (payload?.success === false) {
        throw new Error(payload?.error ?? payload?.message ?? 'Backend request failed');
      }

      return (payload?.data ?? payload) as T;
    } catch (error) {
      clearTimeout(timeoutId);

      // AbortError 表示超时
      if (error instanceof Error && error.name === 'AbortError') {
        lastError = new Error(`Request timeout after ${timeout}ms`);
        if (attempt < maxRetries) {
          continue;
        }
      }

      // 可重试的网络错误
      if (isRetryableError(error) && attempt < maxRetries) {
        lastError = error instanceof Error ? error : new Error(String(error));
        continue;
      }

      throw error;
    }
  }

  // 所有重试都失败
  throw lastError ?? new Error('Request failed after retries');
}
