import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, radius, fonts } from '../../theme';

const FIELDS = [
  { key: 'first_name', label: 'First Name', icon: 'person-outline', placeholder: 'John' },
  { key: 'last_name', label: 'Last Name', icon: 'person-outline', placeholder: 'Doe' },
  { key: 'username', label: 'Username', icon: 'at-outline', placeholder: 'johndoe', autoCapitalize: 'none' },
  { key: 'email', label: 'Email', icon: 'mail-outline', placeholder: 'john@example.com', keyboardType: 'email-address', autoCapitalize: 'none' },
  { key: 'phone_number', label: 'Phone', icon: 'call-outline', placeholder: '+91 9876543210', keyboardType: 'phone-pad' },
];

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm] = useState({
    first_name: '', last_name: '', username: '',
    email: '', phone_number: '', password: '', password_confirm: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (key) => (val) => setForm((prev) => ({ ...prev, [key]: val }));

  async function handleRegister() {
    for (const f of FIELDS) {
      if (!form[f.key].trim()) {
        Alert.alert('Missing field', `Please enter your ${f.label}.`);
        return;
      }
    }
    if (!form.password || form.password.length < 8) {
      Alert.alert('Weak password', 'Password must be at least 8 characters.');
      return;
    }
    if (form.password !== form.password_confirm) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await register(form);
    } catch (e) {
      const data = e.response?.data;
      const msg = data
        ? Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`).join('\n')
        : 'Registration failed.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient colors={['#0a0f1e', '#0d1a2e', '#0a0f1e']} style={styles.gradient}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.title}>Create Account</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardSub}>Register as a citizen to report missing persons</Text>

            {FIELDS.map((f) => (
              <View key={f.key} style={styles.inputGroup}>
                <Text style={styles.label}>{f.label}</Text>
                <View style={styles.inputRow}>
                  <Ionicons name={f.icon} size={18} color={colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={form[f.key]}
                    onChangeText={set(f.key)}
                    placeholder={f.placeholder}
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize={f.autoCapitalize || 'words'}
                    keyboardType={f.keyboardType || 'default'}
                    autoCorrect={false}
                  />
                </View>
              </View>
            ))}

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputRow}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={form.password}
                  onChangeText={set('password')}
                  placeholder="At least 8 characters"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showPass}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                  <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.inputRow}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={form.password_confirm}
                  onChangeText={set('password_confirm')}
                  placeholder="Repeat password"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showPass}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
              <LinearGradient colors={['#8b5cf6', '#6d28d9']} style={styles.btnGradient}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnText}>Create Account</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.loginLink}>
              <Text style={styles.loginText}>
                Already have an account?{' '}
                <Text style={styles.loginBold}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, padding: spacing.lg, paddingTop: 56 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  backBtn: { marginRight: 12, padding: 4 },
  title: { fontSize: fonts.xl, fontWeight: '700', color: colors.textPrimary },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
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
  btn: { marginTop: spacing.md, borderRadius: radius.md, overflow: 'hidden' },
  btnGradient: { height: 50, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontSize: fonts.md, fontWeight: '700' },
  loginLink: { marginTop: spacing.md, alignItems: 'center' },
  loginText: { color: colors.textSecondary, fontSize: fonts.sm },
  loginBold: { color: colors.primaryLight, fontWeight: '700' },
});
