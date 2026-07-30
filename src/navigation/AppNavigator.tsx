import 'react-native-gesture-handler';

import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { LoginScreen } from '../features/auth/presentation/LoginScreen';
import { HomeScreen } from '../features/home/presentation/HomeScreen';
import { AppModule } from '../di/AppModule';
import { colors } from '../designSystem/colors';

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

type AuthState = 'checking' | 'authenticated' | 'unauthenticated';

/**
 * Root navigator. Decides the initial route by checking for a persisted
 * session via the auth use case, then renders the appropriate stack.
 */
function AppNavigator(): React.JSX.Element {
  const [authState, setAuthState] = useState<AuthState>('checking');

  useEffect(() => {
    let isMounted = true;

    AppModule.authUseCase
      .isAuthenticated()
      .then(isAuthenticated => {
        if (isMounted) {
          setAuthState(isAuthenticated ? 'authenticated' : 'unauthenticated');
        }
      })
      .catch(() => {
        if (isMounted) {
          setAuthState('unauthenticated');
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLoginSuccess = useCallback(() => {
    setAuthState('authenticated');
  }, []);

  if (authState === 'checking') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.brand.primary} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {authState === 'authenticated' ? (
          <Stack.Screen name="Home" component={HomeScreen} />
        ) : (
          <Stack.Screen name="Login">
            {() => <LoginScreen onLoginSuccess={handleLoginSuccess} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.primary,
  },
});

export default AppNavigator;
