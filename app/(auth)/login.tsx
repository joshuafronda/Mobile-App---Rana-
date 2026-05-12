import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
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

import HeadLogo from '@/assets/images/head.svg';
import { ranaColors, ranaRadius, ranaSpacing } from '@/src/theme/ranaTheme';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.replace('/(tabs)/explore');
    }, 1500);
  };

  return (
    <LinearGradient
      colors={[ranaColors.backgroundTop, ranaColors.backgroundBottom]}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Logo & Branding */}
          <View style={styles.brandSection}>
            <View style={styles.logoWrap}>
              <HeadLogo width={64} height={64} />
            </View>
            <Text style={styles.brandName}>RANA</Text>
            <Text style={styles.brandTagline}>Travel smarter, explore further</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome Back</Text>
            <Text style={styles.cardSubtitle}>Sign in to continue your journey</Text>

            {/* Email */}
            <View style={styles.inputWrap}>
              <View style={styles.inputIconWrap}>
                <Ionicons name="mail-outline" size={18} color={ranaColors.muted} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor={ranaColors.muted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                editable={!loading}
                autoCapitalize="none"
              />
            </View>

            {/* Password */}
            <View style={styles.inputWrap}>
              <View style={styles.inputIconWrap}>
                <Ionicons name="lock-closed-outline" size={18} color={ranaColors.muted} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={ranaColors.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword(v => !v)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={ranaColors.muted}
                />
              </TouchableOpacity>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotBtn}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="log-in-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.loginBtnText}>Sign In</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Login */}
            <View style={styles.socialRow}>
              <TouchableOpacity style={styles.socialBtn} activeOpacity={0.8}>
                <Ionicons name="logo-google" size={20} color="#EA4335" />
                <Text style={styles.socialBtnText}>Google</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialBtn} activeOpacity={0.8}>
                <Ionicons name="logo-facebook" size={20} color="#1877F2" />
                <Text style={styles.socialBtnText}>Facebook</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Don&apos;t have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/register')}>
              <Text style={styles.footerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: ranaSpacing.lg,
    paddingVertical: 40,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ranaSpacing.sm,
    elevation: 4,
    shadowColor: ranaColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  brandName: {
    fontSize: 28,
    fontWeight: '800',
    color: ranaColors.primary,
    letterSpacing: 4,
  },
  brandTagline: {
    fontSize: 13,
    color: ranaColors.textSecondary,
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: ranaRadius.xl,
    padding: ranaSpacing.lg,
    marginBottom: ranaSpacing.lg,
    elevation: 3,
    shadowColor: ranaColors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: ranaColors.textPrimary,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: ranaColors.textSecondary,
    marginBottom: ranaSpacing.lg,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F8FF',
    borderRadius: ranaRadius.md,
    borderWidth: 1,
    borderColor: '#E8EEF9',
    marginBottom: ranaSpacing.md,
    height: 48,
    paddingRight: 4,
  },
  inputIconWrap: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: ranaColors.textPrimary,
    paddingVertical: 0,
    height: '100%',
  },
  eyeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: ranaRadius.sm,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: ranaSpacing.md,
  },
  forgotText: {
    fontSize: 12,
    fontWeight: '600',
    color: ranaColors.primary,
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: ranaColors.primary,
    borderRadius: ranaRadius.pill,
    paddingVertical: 14,
    minHeight: 50,
  },
  loginBtnDisabled: {
    backgroundColor: ranaColors.muted,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: ranaSpacing.lg,
    gap: ranaSpacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E8EEF9',
  },
  dividerText: {
    fontSize: 12,
    color: ranaColors.muted,
    fontWeight: '500',
  },
  socialRow: {
    flexDirection: 'row',
    gap: ranaSpacing.md,
  },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8EEF9',
    borderRadius: ranaRadius.md,
    paddingVertical: 12,
    minHeight: 48,
  },
  socialBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: ranaColors.textPrimary,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: ranaSpacing.md,
  },
  footerText: {
    fontSize: 13,
    color: ranaColors.textSecondary,
  },
  footerLink: {
    fontSize: 13,
    color: ranaColors.primary,
    fontWeight: '700',
  },
});

export default Login;
