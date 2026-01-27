const DEFAULT_BACKEND_ORIGIN = 'http://localhost:4000';
const DEVICE_ID_KEY = 'eaa_device_id';
const BACKEND_URL_KEY = 'eaa_backend_url';
const BACKEND_SECRET_KEY = 'eaa_backend_secret';

const resolveBackendBaseUrl = (raw: string): string => {
  const trimmed = raw.trim().replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
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
  const stored = readStoredBackendUrl();
  const raw = stored && stored.trim().length > 0 ? stored : readEnvBackendUrl();
  return resolveBackendBaseUrl(raw);
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

const requestToken = async (): Promise<TokenCache> => {
  const sharedSecret = getBackendSharedSecret();
  const response = await fetch(`${getBackendBaseUrl()}/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      deviceId: getDeviceId(),
      sharedSecret,
    }),
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
};

export const getBackendToken = async (): Promise<string> => {
  if (tokenCache && tokenCache.expiresAt - Date.now() > 30_000) {
    return tokenCache.value;
  }

  tokenCache = await requestToken();
  return tokenCache.value;
};

export const resetBackendToken = (): void => {
  tokenCache = null;
};

export type BackendResponse<T> = {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export async function backendRequest<T>(
  path: string,
  init: RequestInit = {},
  options: { auth?: boolean } = {},
): Promise<T> {
  const { auth = true } = options;
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
  });

  const payload: BackendResponse<T> = await response.json().catch(() => ({} as BackendResponse<T>));

  if (!response.ok) {
    throw new Error(payload?.message ?? payload?.error ?? `Request failed (${response.status})`);
  }

  if (payload?.success === false) {
    throw new Error(payload?.error ?? payload?.message ?? 'Backend request failed');
  }

  return (payload?.data ?? payload) as T;
}
