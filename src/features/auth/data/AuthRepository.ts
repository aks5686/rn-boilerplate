import { NetworkClient } from '../../../core/network/NetworkClient';
import { SecureStorage } from '../../../core/storage/SecureStorage';
import {
  AuthSession,
  LoginCredentials,
  RegisterCredentials,
  User,
} from '../domain/AuthUseCaseProtocol';

interface AuthSessionResponseDto {
  user: {
    id: string;
    email: string;
    display_name: string;
    avatar_url: string | null;
    created_at: string;
  };
  access_token: string;
  refresh_token: string;
}

interface RefreshResponseDto {
  access_token: string;
  refresh_token: string;
}

function toUser(dto: AuthSessionResponseDto['user']): User {
  return {
    id: dto.id,
    email: dto.email,
    displayName: dto.display_name,
    avatarUrl: dto.avatar_url,
    createdAt: dto.created_at,
  };
}

function toSession(dto: AuthSessionResponseDto): AuthSession {
  return {
    user: toUser(dto.user),
    accessToken: dto.access_token,
    refreshToken: dto.refresh_token,
  };
}

/**
 * Data layer for authentication. Talks to the remote API and to secure
 * on-device storage; contains no business rules (those live in AuthUseCase).
 */
export class AuthRepository {
  constructor(private readonly networkClient: NetworkClient) {}

  async login(credentials: LoginCredentials): Promise<AuthSession> {
    const response = await this.networkClient.post<AuthSessionResponseDto>('/auth/login', {
      email: credentials.email,
      password: credentials.password,
    });
    const session = toSession(response);
    await this.persistSession(session);
    return session;
  }

  async register(credentials: RegisterCredentials): Promise<AuthSession> {
    const response = await this.networkClient.post<AuthSessionResponseDto>('/auth/register', {
      email: credentials.email,
      password: credentials.password,
      display_name: credentials.displayName,
    });
    const session = toSession(response);
    await this.persistSession(session);
    return session;
  }

  async logout(): Promise<void> {
    try {
      await this.networkClient.post<void>('/auth/logout');
    } finally {
      await SecureStorage.clearAll();
    }
  }

  async getCurrentUser(): Promise<User | null> {
    const isAuthenticated = await SecureStorage.hasValidSession();
    if (!isAuthenticated) {
      return null;
    }
    const dto = await this.networkClient.get<AuthSessionResponseDto['user']>('/auth/me');
    return toUser(dto);
  }

  async refreshSession(refreshToken: string): Promise<AuthSession | null> {
    try {
      const response = await this.networkClient.post<RefreshResponseDto>('/auth/refresh', {
        refresh_token: refreshToken,
      });
      await SecureStorage.setTokens({
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
      });
      const user = await this.getCurrentUser();
      if (!user) return null;
      return {
        user,
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
      };
    } catch {
      return null;
    }
  }

  private async persistSession(session: AuthSession): Promise<void> {
    await SecureStorage.setTokens({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    });
  }
}
