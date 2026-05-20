import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, radius, fonts } from '../../theme';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please enter username and password.');
      return;
    }
    setLoading(true);
    try {
      await login(username.trim(), password);
    } catch (e) {
      const msg = e.response?.data?.detail || e.response?.data?.non_field_errors?.[0] || 'Login failed. Check credentials.';
      Alert.alert('Login Failed', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient colors={['#0a0f1e', '#0d1a2e', '#0a0f1e']} style={styles.gradient}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Logo area */}
          <View style={styles.logoWrap}>
            <View style={styles.logoCircle}>
              <Ionicons name="eye" size={40} color={colors.primaryLight} />
            </View>
            <Text style={styles.appName}>Deep Vision</Text>
            <Text style={styles.tagline}>Missing Person Detection System</Text>
          </View>

          {/* Form card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome back</Text>
            <Text style={styles.cardSub}>Sign in to continue</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <View style={styles.inputRow}>
                <Ionicons name="person-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Enter your username"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputRow}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showPass}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                  <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
              <LinearGradient colors={['#1a56db', '#1240a8']} style={styles.loginGradient}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.loginBtnText}>Sign In</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.registerLink}>
              <Text style={styles.registerText}>
                Don't have an account?{' '}
                <Text style={styles.registerBold}>Register</Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Role info */}
          <View style={styles.rolesRow}>
            {[
              { icon: 'person', label: 'Citizen', color: colors.citizen },
              { icon: 'shield', label: 'Police', color: colors.police },
              { icon: 'settings', label: 'Admin', color: colors.admin },
            ].map((r) => (
              <View key={r.label} style={styles.roleChip}>
                <Ionicons name={r.icon} size={14} color={r.color} />
                <Text style={[styles.roleChipText, { color: r.color }]}>{r.label}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  logoWrap: { alignItems: 'center', marginBottom: spacing.xl },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.bgElevated,
    borderWidth: 2, borderColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
  },
  appName: { fontSize: fonts.xxl, fontWeight: '800', color: colors.textPrimary, letterSpacing: 1 },
  tagline: { fontSize: fonts.sm, color: colors.textSecondary, marginTop: 4 },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: { fontSize: fonts.xl, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  cardSub: { fontSize: fonts.sm, color: colors.textSecondary, marginBottom: spacing.lg },
  inputGroup: { marginBottom: spacing.md },
  label: { fontSize: fonts.sm, color: colors.textSecondary, marginBottom: 6, fontWeight: '600' },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bgInput, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.sm,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, height: 48, color: colors.textPrimary, fontSize: fonts.base },
  eyeBtn: { padding: 8 },
  loginBtn: { marginTop: spacing.md, borderRadius: radius.md, overflow: 'hidden' },
  loginGradient: { height: 50, alignItems: 'center', justifyContent: 'center' },
  loginBtnText: { color: '#fff', fontSize: fonts.md, fontWeight: '700' },
  registerLink: { marginTop: spacing.md, alignItems: 'center' },
  registerText: { color: colors.textSecondary, fontSize: fonts.sm },
  registerBold: { color: colors.primaryLight, fontWeight: '700' },
  rolesRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg, gap: 12 },
  roleChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.bgCard, borderRadius: radius.full,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: colors.border,
  },
  roleChipText: { fontSize: fonts.xs, fontWeight: '600' },
});
