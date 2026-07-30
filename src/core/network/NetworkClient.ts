import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { ApiError } from './ApiError';
import { SecureStorage } from '../storage/SecureStorage';

export interface NetworkClientConfig {
  baseURL: string;
  timeoutMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  /** Called whenever a 401 is received, after the built-in refresh attempt fails. */
  onUnauthorized?: () => void | Promise<void>;
  /** Supplies a fresh access token given a refresh token. Return null to signal failure. */
  refreshAccessToken?: (refreshToken: string) => Promise<string | null>;
}

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retryCount?: number;
  _isRetryRequest?: boolean;
}

const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_RETRY_DELAY_MS = 500;

const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Thin wrapper around Axios that centralizes:
 *  - auth header injection
 *  - 401 handling with a single in-flight token refresh (request queueing)
 *  - exponential-backoff retries for idempotent/transient failures
 *  - normalization of all failures into `ApiError`
 */
export class NetworkClient {
  private readonly instance: AxiosInstance;
  private readonly config: Required<Omit<NetworkClientConfig, 'onUnauthorized' | 'refreshAccessToken'>> &
    Pick<NetworkClientConfig, 'onUnauthorized' | 'refreshAccessToken'>;

  private refreshPromise: Promise<string | null> | null = null;

  constructor(config: NetworkClientConfig) {
    this.config = {
      baseURL: config.baseURL,
      timeoutMs: config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      maxRetries: config.maxRetries ?? DEFAULT_MAX_RETRIES,
      retryDelayMs: config.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS,
      onUnauthorized: config.onUnauthorized,
      refreshAccessToken: config.refreshAccessToken,
    };

    this.instance = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeoutMs,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    this.attachRequestInterceptor();
    this.attachResponseInterceptor();
  }

  private attachRequestInterceptor(): void {
    this.instance.interceptors.request.use(
      async (requestConfig: InternalAxiosRequestConfig) => {
        const token = await SecureStorage.getAccessToken();
        if (token) {
          requestConfig.headers.set('Authorization', `Bearer ${token}`);
        }
        return requestConfig;
      },
      error => Promise.reject(error),
    );
  }

  private attachResponseInterceptor(): void {
    this.instance.interceptors.response.use(
      response => response,
      async (error: AxiosError) => {
        const requestConfig = error.config as RetryableRequestConfig | undefined;

        if (!requestConfig) {
          return Promise.reject(this.normalizeError(error));
        }

        if (axios.isCancel(error)) {
          return Promise.reject(ApiError.cancelled(error));
        }

        const status = error.response?.status;

        // Attempt a single silent token refresh + retry on 401.
        if (status === 401 && !requestConfig._isRetryRequest) {
          return this.handleUnauthorized(requestConfig, error);
        }

        if (this.shouldRetry(error, requestConfig)) {
          return this.retryRequest(requestConfig);
        }

        return Promise.reject(this.normalizeError(error));
      },
    );
  }

  private async handleUnauthorized(
    requestConfig: RetryableRequestConfig,
    error: AxiosError,
  ): Promise<AxiosResponse> {
    const refreshToken = await SecureStorage.getRefreshToken();

    if (!refreshToken || !this.config.refreshAccessToken) {
      await this.config.onUnauthorized?.();
      throw this.normalizeError(error);
    }

    try {
      if (!this.refreshPromise) {
        this.refreshPromise = this.config
          .refreshAccessToken(refreshToken)
          .finally(() => {
            this.refreshPromise = null;
          });
      }

      const newAccessToken = await this.refreshPromise;

      if (!newAccessToken) {
        await this.config.onUnauthorized?.();
        throw this.normalizeError(error);
      }

      await SecureStorage.setAccessToken(newAccessToken);

      requestConfig._isRetryRequest = true;
      requestConfig.headers.set('Authorization', `Bearer ${newAccessToken}`);
      return this.instance.request(requestConfig);
    } catch (refreshError) {
      await this.config.onUnauthorized?.();
      throw this.normalizeError(refreshError);
    }
  }

  private shouldRetry(error: AxiosError, requestConfig: RetryableRequestConfig): boolean {
    const method = requestConfig.method?.toLowerCase();
    const isIdempotent = method === 'get' || method === 'head' || method === 'options';
    const retryCount = requestConfig._retryCount ?? 0;

    if (!isIdempotent || retryCount >= this.config.maxRetries) {
      return false;
    }

    if (!error.response) {
      // Network error / no response (DNS failure, offline, timeout without response).
      return true;
    }

    return RETRYABLE_STATUS_CODES.has(error.response.status);
  }

  private async retryRequest(requestConfig: RetryableRequestConfig): Promise<AxiosResponse> {
    const retryCount = (requestConfig._retryCount ?? 0) + 1;
    requestConfig._retryCount = retryCount;

    const backoff = this.config.retryDelayMs * 2 ** (retryCount - 1);
    await delay(backoff);

    return this.instance.request(requestConfig);
  }

  private normalizeError(error: unknown): ApiError {
    if (error instanceof ApiError) {
      return error;
    }

    if (!axios.isAxiosError(error)) {
      return ApiError.unknown(error);
    }

    if (axios.isCancel(error)) {
      return ApiError.cancelled(error);
    }

    if (error.code === 'ECONNABORTED') {
      return ApiError.timeout(error);
    }

    if (!error.response) {
      return ApiError.network(error);
    }

    const { status, data } = error.response;
    const payload = (data as ApiError['payload']) ?? null;

    switch (status) {
      case 400:
        return ApiError.badRequest(payload, error);
      case 401:
        return ApiError.unauthorized(payload, error);
      case 403:
        return ApiError.forbidden(payload, error);
      case 404:
        return ApiError.notFound(payload, error);
      case 409:
        return ApiError.conflict(payload, error);
      case 422:
        return ApiError.validation(payload, error);
      default:
        if (status >= 500) {
          return ApiError.server(status, payload, error);
        }
        return ApiError.unknown(error, status);
    }
  }

  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.get<T>(url, config);
    return response.data;
  }

  public async post<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.post<T>(url, body, config);
    return response.data;
  }

  public async put<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.put<T>(url, body, config);
    return response.data;
  }

  public async patch<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.patch<T>(url, body, config);
    return response.data;
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.delete<T>(url, config);
    return response.data;
  }

  /** Exposed for advanced use cases (e.g. attaching request-scoped interceptors in tests). */
  public get raw(): AxiosInstance {
    return this.instance;
  }
}
