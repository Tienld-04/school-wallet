import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../../constants/theme';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ title, subtitle, children }) => (
  <View style={styles.root}>
    <StatusBar style="light" />
    <SafeAreaView edges={['top']} style={styles.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.root}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brand}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>SW</Text>
            </View>
            <View>
              <Text style={styles.brandName}>School Wallet</Text>
              <Text style={styles.brandTagline}>Ví điện tử trường học</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  </View>
);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.primary[800],
  },
  scroll: {
    flexGrow: 1,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 28,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
  brandName: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
  },
  brandTagline: {
    color: colors.primary[300],
    fontSize: 12,
    fontWeight: '500',
  },
  card: {
    flexGrow: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 40,
    gap: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.slate[900],
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.slate[500],
    textAlign: 'center',
    marginTop: -12,
    marginBottom: 4,
  },
});

export default AuthLayout;
