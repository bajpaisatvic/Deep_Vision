import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Image, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { casesApi } from '../../api/casesApi';
import { colors, spacing, radius, fonts } from '../../theme';

const GENDERS = ['MALE', 'FEMALE', 'OTHER'];

export default function ReportMissingScreen({ navigation }) {
  const [form, setForm] = useState({
    name: '', age: '', gender: 'MALE',
    description: '', last_seen_location: '', last_seen_time: '',
  });
  const [image, setImage] = useState(null);
  const [step, setStep] = useState(1); // 1: details, 2: photo, 3: done
  const [loading, setLoading] = useState(false);

  const set = (key) => (val) => setForm((p) => ({ ...p, [key]: val }));

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo library access.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setImage(result.assets[0]);
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow camera access.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setImage(result.assets[0]);
  }

  async function handleSubmit() {
    if (!form.name.trim()) { Alert.alert('Error', 'Name is required.'); return; }
    if (!form.age || isNaN(Number(form.age))) { Alert.alert('Error', 'Valid age is required.'); return; }
    if (!image) { Alert.alert('Photo required', 'Please add a photo for face recognition to work.'); return; }

    setLoading(true);
    try {
      // Create the case
      const payload = { ...form, age: Number(form.age) };
      const { data: newCase } = await casesApi.create(payload);

      // Upload photo
      await casesApi.uploadImage(newCase.id, image.uri, image.mimeType || 'image/jpeg');

      setStep(3);
    } catch (e) {
      const msg = e.response?.data
        ? Object.values(e.response.data).flat().join('\n')
        : 'Failed to submit. Check your connection.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }

  if (step === 3) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successWrap}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={70} color={colors.success} />
          </View>
          <Text style={styles.successTitle}>Report Submitted!</Text>
          <Text style={styles.successSub}>
            Your case has been registered. Our AI system will actively scan cameras to find the missing person.
          </Text>
          <TouchableOpacity style={styles.successBtn} onPress={() => { setStep(1); setForm({ name: '', age: '', gender: 'MALE', description: '', last_seen_location: '', last_seen_time: '' }); setImage(null); navigation.navigate('Home'); }}>
            <Text style={styles.successBtnText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Report Missing Person</Text>
        <View style={styles.stepIndicator}>
          <View style={[styles.step, step >= 1 && styles.stepActive]}>
            <Text style={styles.stepText}>1</Text>
          </View>
          <View style={styles.stepLine} />
          <View style={[styles.step, step >= 2 && styles.stepActive]}>
            <Text style={styles.stepText}>2</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {step === 1 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Person Details</Text>

            {[
              { key: 'name', label: 'Full Name *', placeholder: 'Enter full name' },
              { key: 'age', label: 'Age *', placeholder: 'Age in years', keyboardType: 'numeric' },
              { key: 'last_seen_location', label: 'Last Seen Location', placeholder: 'e.g. Connaught Place, Delhi' },
              { key: 'last_seen_time', label: 'Last Seen Time', placeholder: 'e.g. 2024-03-14 18:00' },
            ].map((f) => (
              <View key={f.key} style={styles.field}>
                <Text style={styles.label}>{f.label}</Text>
                <TextInput
                  style={styles.input}
                  value={form[f.key]}
                  onChangeText={set(f.key)}
                  placeholder={f.placeholder}
                  placeholderTextColor={colors.textMuted}
                  keyboardType={f.keyboardType || 'default'}
                />
              </View>
            ))}

            <View style={styles.field}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.genderRow}>
                {GENDERS.map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.genderBtn, form.gender === g && styles.genderBtnActive]}
                    onPress={() => set('gender')(g)}
                  >
                    <Text style={[styles.genderText, form.gender === g && styles.genderTextActive]}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                value={form.description}
                onChangeText={set('description')}
                placeholder="Physical description, clothing, etc."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity style={styles.nextBtn} onPress={() => setStep(2)}>
              <Text style={styles.nextBtnText}>Next: Add Photo →</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Upload Face Photo</Text>
            <Text style={styles.photoHint}>
              A clear face photo is required for the AI recognition system to identify the person in camera feeds.
            </Text>

            {image ? (
              <View style={styles.previewWrap}>
                <Image source={{ uri: image.uri }} style={styles.preview} />
                <TouchableOpacity style={styles.changePhotoBtn} onPress={() => setImage(null)}>
                  <Text style={styles.changePhotoText}>Change Photo</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.photoOptions}>
                <TouchableOpacity style={styles.photoOption} onPress={takePhoto}>
                  <Ionicons name="camera" size={36} color={colors.primaryLight} />
                  <Text style={styles.photoOptionText}>Take Photo</Text>
                </TouchableOpacity>
                <View style={styles.photoDivider} />
                <TouchableOpacity style={styles.photoOption} onPress={pickImage}>
                  <Ionicons name="images" size={36} color={colors.citizen} />
                  <Text style={styles.photoOptionText}>Choose from Gallery</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.row}>
              <TouchableOpacity style={[styles.nextBtn, styles.backBtn2]} onPress={() => setStep(1)}>
                <Text style={styles.backBtnText}>← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.nextBtn, styles.submitBtn]} onPress={handleSubmit} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.nextBtnText}>Submit Report</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: fonts.lg, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm },
  stepIndicator: { flexDirection: 'row', alignItems: 'center' },
  step: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.bgElevated, borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  stepActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  stepText: { color: '#fff', fontSize: fonts.xs, fontWeight: '700' },
  stepLine: { flex: 1, height: 2, backgroundColor: colors.border, maxWidth: 40 },
  scroll: { padding: spacing.md },
  card: { backgroundColor: colors.bgCard, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  cardTitle: { fontSize: fonts.lg, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.md },
  field: { marginBottom: spacing.md },
  label: { fontSize: fonts.sm, color: colors.textSecondary, marginBottom: 6, fontWeight: '600' },
  input: {
    backgroundColor: colors.bgInput, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.sm, color: colors.textPrimary, fontSize: fonts.base,
  },
  textarea: { height: 100 },
  genderRow: { flexDirection: 'row', gap: 10 },
  genderBtn: {
    flex: 1, padding: 10, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', backgroundColor: colors.bgInput,
  },
  genderBtnActive: { backgroundColor: colors.primaryDark, borderColor: colors.primary },
  genderText: { color: colors.textMuted, fontWeight: '600', fontSize: fonts.sm },
  genderTextActive: { color: '#fff' },
  nextBtn: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    padding: 14, alignItems: 'center', marginTop: spacing.md,
  },
  nextBtnText: { color: '#fff', fontWeight: '700', fontSize: fonts.base },
  photoHint: { fontSize: fonts.sm, color: colors.textSecondary, marginBottom: spacing.lg, lineHeight: 20 },
  photoOptions: {
    flexDirection: 'row', backgroundColor: colors.bgInput,
    borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.border,
  },
  photoOption: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: 10 },
  photoOptionText: { color: colors.textSecondary, fontSize: fonts.sm, fontWeight: '600' },
  photoDivider: { width: 1, backgroundColor: colors.border },
  previewWrap: { alignItems: 'center', gap: 12 },
  preview: { width: 200, height: 200, borderRadius: radius.xl, borderWidth: 3, borderColor: colors.primary },
  changePhotoBtn: { padding: 10 },
  changePhotoText: { color: colors.primaryLight, fontWeight: '600' },
  row: { flexDirection: 'row', gap: 10, marginTop: spacing.md },
  backBtn2: { flex: 1, backgroundColor: colors.bgElevated },
  backBtnText: { color: colors.textSecondary, fontWeight: '700', fontSize: fonts.base },
  submitBtn: { flex: 2, backgroundColor: colors.success },
  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, backgroundColor: colors.bg },
  successIcon: { marginBottom: spacing.lg },
  successTitle: { fontSize: fonts.xxl, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.sm },
  successSub: { fontSize: fonts.base, color: colors.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: spacing.xl },
  successBtn: { backgroundColor: colors.primary, borderRadius: radius.lg, paddingHorizontal: spacing.xl, paddingVertical: 14 },
  successBtnText: { color: '#fff', fontWeight: '700', fontSize: fonts.md },
});
