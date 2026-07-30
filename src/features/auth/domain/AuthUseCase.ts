import { ApiError, ApiErrorType } from '../../../core/network/ApiError';
import { SecureStorage } from '../../../core/storage/SecureStorage';
import { isValidEmail, isBlank } from '../../../core/extensions/stringExtensions';
import {
  AuthRepositoryProtocol,
  AuthSession,
  AuthUseCaseProtocol,
  LoginCredentials,
  RegisterCredentials,
  User,
} from './AuthUseCaseProtocol';

const MIN_PASSWORD_LENGTH = 8;

/**
 * Business-logic implementation of `AuthUseCaseProtocol`. Owns validation
 * rules and orchestrates the repository; the repository owns wire format
 * and persistence details.
 */
export class AuthUseCase implements AuthUseCaseProtocol {
  constructor(private readonly authRepository: AuthRepositoryProtocol) {}

  async login(credentials: LoginCredentials): Promise<AuthSession> {
    this.validateLoginCredentials(credentials);
    return this.authRepository.login(credentials);
  }

  async register(credentials: RegisterCredentials): Promise<AuthSession> {
    this.validateRegisterCredentials(credentials);
    return this.authRepository.register(credentials);
  }

  async logout(): Promise<void> {
    await this.authRepository.logout();
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      return await this.authRepository.getCurrentUser();
    } catch (error) {
      if (error instanceof ApiError && error.type === ApiErrorType.UNAUTHORIZED) {
        return null;
      }
      throw error;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    return SecureStorage.hasValidSession();
  }

  async refreshSession(): Promise<AuthSession | null> {
    const refreshToken = await SecureStorage.getRefreshToken();
    if (!refreshToken) {
      return null;
    }
    return this.authRepository.refreshSession(refreshToken);
  }

  private validateLoginCredentials(credentials: LoginCredentials): void {
    if (isBlank(credentials.email) || !isValidEmail(credentials.email)) {
      throw ApiError.validation({ message: 'Please enter a valid email address.' });
    }
    if (isBlank(credentials.password)) {
      throw ApiError.validation({ message: 'Please enter your password.' });
    }
  }

  private validateRegisterCredentials(credentials: RegisterCredentials): void {
    if (isBlank(credentials.email) || !isValidEmail(credentials.email)) {
      throw ApiError.validation({ message: 'Please enter a valid email address.' });
    }
    if (isBlank(credentials.displayName)) {
      throw ApiError.validation({ message: 'Please enter your name.' });
    }
    if (credentials.password.length < MIN_PASSWORD_LENGTH) {
      throw ApiError.validation({
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`,
      });
    }
  }
}
