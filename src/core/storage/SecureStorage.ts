import * as Keychain from 'react-native-keychain';

/**
 * Wraps react-native-keychain to provide a small, typed API for storing
 * auth tokens in the platform secure storage (Keychain on iOS, Keystore-backed
 * EncryptedSharedPreferences on Android).
 *
 * Tokens are stored under distinct "services" so the access and refresh
 * tokens can be rotated independently without clobbering one another.
 */

const ACCESS_TOKEN_SERVICE = 'com.boilerplate.auth.accessToken';
const REFRESH_TOKEN_SERVICE = 'com.boilerplate.auth.refreshToken';

async function setSecureValue(service: string, value: string): Promise<void> {
  await Keychain.setGenericPassword(service, value, {
    service,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

async function getSecureValue(service: string): Promise<string | null> {
  const result = await Keychain.getGenericPassword({ service });
  if (!result) {
    return null;
  }
  return result.password;
}

async function clearSecureValue(service: string): Promise<void> {
  await Keychain.resetGenericPassword({ service });
}

export const SecureStorage = {
  async setAccessToken(token: string): Promise<void> {
    await setSecureValue(ACCESS_TOKEN_SERVICE, token);
  },

  async getAccessToken(): Promise<string | null> {
    return getSecureValue(ACCESS_TOKEN_SERVICE);
  },

  async clearAccessToken(): Promise<void> {
    await clearSecureValue(ACCESS_TOKEN_SERVICE);
  },

  async setRefreshToken(token: string): Promise<void> {
    await setSecureValue(REFRESH_TOKEN_SERVICE, token);
  },

  async getRefreshToken(): Promise<string | null> {
    return getSecureValue(REFRESH_TOKEN_SERVICE);
  },

  async clearRefreshToken(): Promise<void> {
    await clearSecureValue(REFRESH_TOKEN_SERVICE);
  },

  async setTokens(tokens: { accessToken: string; refreshToken: string }): Promise<void> {
    await Promise.all([
      this.setAccessToken(tokens.accessToken),
      this.setRefreshToken(tokens.refreshToken),
    ]);
  },

  /** Clears both tokens. Call this on logout or when a refresh irrecoverably fails. */
  async clearAll(): Promise<void> {
    await Promise.all([this.clearAccessToken(), this.clearRefreshToken()]);
  },

  async hasValidSession(): Promise<boolean> {
    const token = await this.getAccessToken();
    return token !== null && token.length > 0;
  },
};
