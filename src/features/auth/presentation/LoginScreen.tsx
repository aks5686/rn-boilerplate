import React, { useCallback, useEffect } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';
import { useLoginViewModel } from './LoginViewModel';
import { colors } from '../../../designSystem/colors';
import { typography } from '../../../designSystem/typography';
import { spacing, radius, layout } from '../../../designSystem/spacing';

export interface LoginScreenProps {
  onLoginSuccess?: (userId: string) => void;
}

/**
 * View layer for authentication. Contains no business logic — it only
 * reads state from `useLoginViewModel` and forwards user intent (text
 * changes, submit taps) to the ViewModel's actions.
 */
export function LoginScreen({ onLoginSuccess }: LoginScreenProps): React.JSX.Element {
  const { email, password, isSubmitting, errorMessage, user, setEmail, setPassword, submit } =
    useLoginViewModel(
      useShallow(state => ({
        email: state.email,
        password: state.password,
        isSubmitting: state.isSubmitting,
        errorMessage: state.errorMessage,
        user: state.user,
        setEmail: state.setEmail,
        setPassword: state.setPassword,
        submit: state.submit,
      })),
    );

  useEffect(() => {
    if (user) {
      onLoginSuccess?.(user.id);
    }
  }, [user, onLoginSuccess]);

  const handleSubmit = useCallback(() => {
    submit();
  }, [submit]);

  const isSubmitDisabled = isSubmitting || email.trim().length === 0 || password.length === 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={colors.text.tertiary}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                returnKeyType="next"
                editable={!isSubmitting}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.text.tertiary}
                secureTextEntry
                textContentType="password"
                returnKeyType="done"
                editable={!isSubmitting}
                onSubmitEditing={handleSubmit}
              />
            </View>

            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.submitButton, isSubmitDisabled && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitDisabled}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.text.inverse} />
              ) : (
                <Text style={styles.submitButtonText}>Sign in</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: layout.screenHorizontalPadding,
    paddingVertical: layout.screenVerticalPadding,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.displaySmall,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    marginTop: spacing.xxs,
  },
  form: {
    gap: spacing.md,
  },
  field: {
    gap: spacing.xxs,
  },
  label: {
    ...typography.labelMedium,
    color: colors.text.primary,
  },
  input: {
    ...typography.bodyLarge,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: layout.minTouchTarget,
    backgroundColor: colors.background.secondary,
  },
  errorContainer: {
    backgroundColor: colors.status.errorMuted,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.status.errorStrong,
  },
  submitButton: {
    backgroundColor: colors.brand.primary,
    borderRadius: radius.md,
    minHeight: layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  submitButtonDisabled: {
    backgroundColor: colors.border.strong,
  },
  submitButtonText: {
    ...typography.button,
    color: colors.text.inverse,
  },
});
