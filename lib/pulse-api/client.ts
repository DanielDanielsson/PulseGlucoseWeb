import type {
  ApiKeyCreateResponse,
  ApiKeyListResponse,
  ConsumerProfileResponse,
  ConsumerProfileUpdatePayload,
  PulseApiErrorResponse,
  PulseApiStatusReport
} from '@/lib/pulse-api/types';

export class PulseApiClientError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'PulseApiClientError';
    this.status = status;
  }
}

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable ${name}`);
  }

  return value;
}

function getApiBaseUrl(): string {
  return getRequiredEnv('PULSE_API_BASE_URL');
}

function resolveUrl(path: string): string {
  return new URL(path, getApiBaseUrl()).toString();
}

async function parseJson<T>(response: Response): Promise<T> {
  const raw = await response.text();
  if (!raw) {
    return {} as T;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new PulseApiClientError(response.status, 'Pulse API returned invalid JSON');
  }
}

async function parseError(response: Response): Promise<never> {
  let payload: PulseApiErrorResponse | null = null;

  try {
    payload = await parseJson<PulseApiErrorResponse>(response);
  } catch {
    payload = null;
  }

  const message = payload?.error?.message || `Pulse API request failed with status ${response.status}`;
  throw new PulseApiClientError(response.status, message);
}

function createAdminHeaders(extraHeaders: HeadersInit = {}): Headers {
  const headers = new Headers(extraHeaders);
  headers.set('Authorization', `Bearer ${getRequiredEnv('PULSE_API_ADMIN_TOKEN')}`);
  return headers;
}

async function adminJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = createAdminHeaders(init.headers);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(resolveUrl(path), {
    ...init,
    headers,
    cache: 'no-store'
  });

  if (!response.ok) {
    await parseError(response);
  }

  return parseJson<T>(response);
}

export async function fetchApiStatus(): Promise<PulseApiStatusReport> {
  const headers = new Headers();
  const statusToken = process.env.PULSE_API_STATUS_TOKEN?.trim();
  if (statusToken) {
    headers.set('x-status-token', statusToken);
  }

  const response = await fetch(resolveUrl('/api/status?format=json'), {
    headers,
    cache: 'no-store'
  });

  if (!response.ok) {
    await parseError(response);
  }

  return parseJson<PulseApiStatusReport>(response);
}

export async function fetchConsumerProfile(timezone?: string): Promise<ConsumerProfileResponse> {
  const headers = new Headers();
  if (timezone) {
    headers.set('x-user-timezone', timezone);
  }

  return adminJson<ConsumerProfileResponse>('/api/admin/settings/profile', {
    method: 'GET',
    headers
  });
}

export async function updateConsumerProfile(
  payload: ConsumerProfileUpdatePayload,
  timezone?: string
): Promise<ConsumerProfileResponse> {
  const headers = new Headers();
  if (timezone) {
    headers.set('x-user-timezone', timezone);
  }

  return adminJson<ConsumerProfileResponse>('/api/admin/settings/profile', {
    method: 'PUT',
    headers,
    body: JSON.stringify(payload)
  });
}

export async function listApiKeys(): Promise<ApiKeyListResponse> {
  return adminJson<ApiKeyListResponse>('/api/admin/keys/list', {
    method: 'GET'
  });
}

export async function createApiKey(name: string): Promise<ApiKeyCreateResponse> {
  return adminJson<ApiKeyCreateResponse>('/api/admin/keys/create', {
    method: 'POST',
    body: JSON.stringify({ name })
  });
}

export async function revokeApiKey(id: string): Promise<void> {
  await adminJson('/api/admin/keys/revoke', {
    method: 'POST',
    body: JSON.stringify({ id })
  });
}

export async function fetchDexcomConnectLocation(): Promise<string> {
  const response = await fetch(resolveUrl('/api/auth/start'), {
    method: 'GET',
    headers: createAdminHeaders(),
    cache: 'no-store',
    redirect: 'manual'
  });

  if (response.status < 300 || response.status >= 400) {
    await parseError(response);
  }

  const location = response.headers.get('location');
  if (!location) {
    throw new PulseApiClientError(502, 'Pulse API did not return a Dexcom redirect location');
  }

  return location.startsWith('http') ? location : new URL(location, getApiBaseUrl()).toString();
}
