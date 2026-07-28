import { NetworkClient } from '../core/network/NetworkClient';
import { SecureStorage } from '../core/storage/SecureStorage';
import { AuthRepository } from '../features/auth/data/AuthRepository';
import { AuthUseCase } from '../features/auth/domain/AuthUseCase';
import { AuthUseCaseProtocol } from '../features/auth/domain/AuthUseCaseProtocol';

const API_BASE_URL = 'https://api.boilerplate.example.com/v1';

/**
 * Manual, lazy dependency-injection container.
 *
 * We deliberately avoid a DI framework (no Hilt/InversifyJS/tsyringe): the
 * dependency graph in a mobile app is small and static, so a hand-written
 * container is easier to read, easier to debug, and has zero runtime/reflection
 * overhead. Every dependency is exposed as a lazily-instantiated singleton
 * getter — nothing is constructed until it's first used.
 *
 * Usage:
 *   const authUseCase = AppModule.authUseCase;
 *
 * Testing:
 *   Call `AppModule.reset()` between test suites, and/or use
 *   `AppModule.override({ authUseCase: fakeAuthUseCase })` to inject test doubles.
 */
class AppModuleContainer {
  private _networkClient?: NetworkClient;
  private _authRepository?: AuthRepository;
  private _authUseCase?: AuthUseCaseProtocol;

  private overrides: Partial<{
    networkClient: NetworkClient;
    authRepository: AuthRepository;
    authUseCase: AuthUseCaseProtocol;
  }> = {};

  get networkClient(): NetworkClient {
    if (this.overrides.networkClient) return this.overrides.networkClient;
    if (!this._networkClient) {
      this._networkClient = new NetworkClient({
        baseURL: API_BASE_URL,
        onUnauthorized: async () => {
          await SecureStorage.clearAll();
        },
        refreshAccessToken: async (_refreshToken: string) => {
          const session = await this.authUseCase.refreshSession();
          return session?.accessToken ?? null;
        },
      });
    }
    return this._networkClient;
  }

  get authRepository(): AuthRepository {
    if (this.overrides.authRepository) return this.overrides.authRepository;
    if (!this._authRepository) {
      this._authRepository = new AuthRepository(this.networkClient);
    }
    return this._authRepository;
  }

  get authUseCase(): AuthUseCaseProtocol {
    if (this.overrides.authUseCase) return this.overrides.authUseCase;
    if (!this._authUseCase) {
      this._authUseCase = new AuthUseCase(this.authRepository);
    }
    return this._authUseCase;
  }

  /** Injects test doubles. Intended for use in unit/integration tests only. */
  override(overrides: Partial<AppModuleContainer['overrides']>): void {
    this.overrides = { ...this.overrides, ...overrides };
  }

  /** Clears cached singletons and overrides. Call from `afterEach` in tests. */
  reset(): void {
    this._networkClient = undefined;
    this._authRepository = undefined;
    this._authUseCase = undefined;
    this.overrides = {};
  }
}

export const AppModule = new AppModuleContainer();
