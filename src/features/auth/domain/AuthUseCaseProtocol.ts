/**
 * Domain layer contract for authentication. The presentation layer (ViewModels)
 * depends only on this interface, never on the concrete repository/network
 * implementation — this is what lets us swap the data layer (e.g. for tests
 * or a different backend) without touching UI code.
 */

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
}

export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  displayName: string;
}

/**
 * Business-logic contract for auth operations. Implementations must:
 *  - persist tokens on successful login/register/refresh
 *  - clear tokens on logout
 *  - throw `ApiError` (or subclasses) on failure
 */
export interface AuthUseCaseProtocol {
  login(credentials: LoginCredentials): Promise<AuthSession>;
  register(credentials: RegisterCredentials): Promise<AuthSession>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  isAuthenticated(): Promise<boolean>;
  refreshSession(): Promise<AuthSession | null>;
}

/**
 * Data-layer contract consumed by `AuthUseCase`. Both the real,
 * network-backed `AuthRepository` and the local `MockAuthRepository`
 * implement this, so the use case can be wired to either without changes.
 */
export interface AuthRepositoryProtocol {
  login(credentials: LoginCredentials): Promise<AuthSession>;
  register(credentials: RegisterCredentials): Promise<AuthSession>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  refreshSession(refreshToken: string): Promise<AuthSession | null>;
}
