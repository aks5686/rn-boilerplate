/**
 * Typed error hierarchy for network/API failures.
 * These classes normalize Axios errors (and any other transport errors)
 * into a consistent shape the rest of the app can branch on with `instanceof`.
 */

export enum ApiErrorType {
  NETWORK = 'NETWORK',
  TIMEOUT = 'TIMEOUT',
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  VALIDATION = 'VALIDATION',
  SERVER = 'SERVER',
  CANCELLED = 'CANCELLED',
  UNKNOWN = 'UNKNOWN',
}

export interface ApiErrorPayload {
  message?: string;
  code?: string;
  errors?: Record<string, string[]>;
  [key: string]: unknown;
}

/**
 * Base class for every error thrown by the network layer.
 * Always carries a `type` so callers can render/react without parsing strings.
 */
export class ApiError extends Error {
  public readonly type: ApiErrorType;
  public readonly statusCode: number | null;
  public readonly payload: ApiErrorPayload | null;
  public readonly isRetryable: boolean;
  public readonly originalError: unknown;

  constructor(params: {
    type: ApiErrorType;
    message: string;
    statusCode?: number | null;
    payload?: ApiErrorPayload | null;
    isRetryable?: boolean;
    originalError?: unknown;
  }) {
    super(params.message);
    this.name = 'ApiError';
    this.type = params.type;
    this.statusCode = params.statusCode ?? null;
    this.payload = params.payload ?? null;
    this.isRetryable = params.isRetryable ?? false;
    this.originalError = params.originalError;

    // Restore prototype chain (needed when targeting ES5 or using certain bundlers).
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static network(originalError?: unknown): ApiError {
    return new ApiError({
      type: ApiErrorType.NETWORK,
      message: 'Unable to reach the server. Please check your internet connection.',
      isRetryable: true,
      originalError,
    });
  }

  static timeout(originalError?: unknown): ApiError {
    return new ApiError({
      type: ApiErrorType.TIMEOUT,
      message: 'The request timed out. Please try again.',
      isRetryable: true,
      originalError,
    });
  }

  static cancelled(originalError?: unknown): ApiError {
    return new ApiError({
      type: ApiErrorType.CANCELLED,
      message: 'The request was cancelled.',
      isRetryable: false,
      originalError,
    });
  }

  static unauthorized(payload?: ApiErrorPayload | null, originalError?: unknown): ApiError {
    return new ApiError({
      type: ApiErrorType.UNAUTHORIZED,
      message: payload?.message ?? 'Your session has expired. Please sign in again.',
      statusCode: 401,
      payload,
      isRetryable: false,
      originalError,
    });
  }

  static forbidden(payload?: ApiErrorPayload | null, originalError?: unknown): ApiError {
    return new ApiError({
      type: ApiErrorType.FORBIDDEN,
      message: payload?.message ?? 'You do not have permission to perform this action.',
      statusCode: 403,
      payload,
      isRetryable: false,
      originalError,
    });
  }

  static notFound(payload?: ApiErrorPayload | null, originalError?: unknown): ApiError {
    return new ApiError({
      type: ApiErrorType.NOT_FOUND,
      message: payload?.message ?? 'The requested resource was not found.',
      statusCode: 404,
      payload,
      isRetryable: false,
      originalError,
    });
  }

  static conflict(payload?: ApiErrorPayload | null, originalError?: unknown): ApiError {
    return new ApiError({
      type: ApiErrorType.CONFLICT,
      message: payload?.message ?? 'This action conflicts with the current state.',
      statusCode: 409,
      payload,
      isRetryable: false,
      originalError,
    });
  }

  static validation(payload?: ApiErrorPayload | null, originalError?: unknown): ApiError {
    return new ApiError({
      type: ApiErrorType.VALIDATION,
      message: payload?.message ?? 'Some fields are invalid. Please review and try again.',
      statusCode: 422,
      payload,
      isRetryable: false,
      originalError,
    });
  }

  static badRequest(payload?: ApiErrorPayload | null, originalError?: unknown): ApiError {
    return new ApiError({
      type: ApiErrorType.BAD_REQUEST,
      message: payload?.message ?? 'The request was invalid.',
      statusCode: 400,
      payload,
      isRetryable: false,
      originalError,
    });
  }

  static server(statusCode: number, payload?: ApiErrorPayload | null, originalError?: unknown): ApiError {
    return new ApiError({
      type: ApiErrorType.SERVER,
      message: payload?.message ?? 'Something went wrong on our end. Please try again later.',
      statusCode,
      payload,
      isRetryable: true,
      originalError,
    });
  }

  static unknown(originalError?: unknown, statusCode?: number | null): ApiError {
    return new ApiError({
      type: ApiErrorType.UNKNOWN,
      message: 'An unexpected error occurred. Please try again.',
      statusCode: statusCode ?? null,
      isRetryable: false,
      originalError,
    });
  }
}
