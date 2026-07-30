import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../../designSystem/colors';
import { typography } from '../../../designSystem/typography';
import { spacing, layout } from '../../../designSystem/spacing';

/**
 * Minimal authenticated landing screen shown after a successful login.
 * Replace with the real Home feature as the app grows.
 */
export function HomeScreen(): React.JSX.Element {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Text style={styles.title}>You're signed in</Text>
        <Text style={styles.subtitle}>This is the Home screen.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: layout.screenHorizontalPadding,
    gap: spacing.xxs,
  },
  title: {
    ...typography.headingLarge,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
  },
});
