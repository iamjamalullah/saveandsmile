import * as SecureStore from 'expo-secure-store';

const DEFAULT_API_BASE = 'https://saveandsmile.vercel.app/api';
const TOKEN_KEY = 'save_and_smile_admin_token';
const API_URL_KEY = 'save_and_smile_api_url';

let memoryToken: string | null = null;
let customApiBase: string | null = null;

export async function setApiBaseUrl(url: string): Promise<void> {
  customApiBase = url;
  try {
    await SecureStore.setItemAsync(API_URL_KEY, url);
  } catch {}
}

export async function getApiBaseUrl(): Promise<string> {
  if (customApiBase) return customApiBase;
  try {
    const stored = await SecureStore.getItemAsync(API_URL_KEY);
    if (stored) {
      customApiBase = stored;
      return stored;
    }
  } catch {}
  return DEFAULT_API_BASE;
}

export async function setAuthToken(token: string | null): Promise<void> {
  memoryToken = token;
  try {
    if (token) {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  } catch {}
}

export async function getAuthToken(): Promise<string | null> {
  if (memoryToken) return memoryToken;
  try {
    const stored = await SecureStore.getItemAsync(TOKEN_KEY);
    if (stored) {
      memoryToken = stored;
      return stored;
    }
  } catch {}
  return null;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  timeoutMs?: number;
}

export async function apiRequest<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, timeoutMs = 15000 } = options;
  const baseUrl = await getApiBaseUrl();
  const token = await getAuthToken();

  const fullUrl = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const reqHeaders: Record<string, string> = {
    'Accept': 'application/json',
    ...headers,
  };

  if (body !== undefined && !(body instanceof FormData)) {
    reqHeaders['Content-Type'] = 'application/json';
  }

  if (token) {
    reqHeaders['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(fullUrl, {
      method,
      headers: reqHeaders,
      body: body !== undefined ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const contentType = res.headers.get('content-type') || '';
    let responseData: any = null;

    if (contentType.includes('application/json')) {
      responseData = await res.json();
    } else {
      responseData = await res.text();
    }

    if (!res.ok) {
      const errorMsg = responseData?.error || responseData?.message || `HTTP ${res.status}: ${res.statusText}`;
      const err = new Error(errorMsg);
      (err as any).status = res.status;
      (err as any).data = responseData;
      throw err;
    }

    return responseData as T;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Network timeout: Could not connect to Save & Smile server. Please check your internet connection.');
    }
    throw err;
  }
}
