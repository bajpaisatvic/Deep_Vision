import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, Alert, Modal,
  TextInput, ScrollView, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { camerasApi } from '../../api/camerasApi';
import { colors, spacing, radius, fonts } from '../../theme';

const EMPTY_FORM = { name: '', location_name: '', latitude: '', longitude: '', stream_url: '', zone: '' };

export default function CameraManagementScreen() {
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editCam, setEditCam] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await camerasApi.list();
      setCameras(data.results ?? data);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (key) => (val) => setForm((p) => ({ ...p, [key]: val }));

  function openAdd() {
    setEditCam(null);
    setForm(EMPTY_FORM);
    setModalVisible(true);
  }

  function openEdit(cam) {
    setEditCam(cam);
    setForm({
      name: cam.name,
      location_name: cam.location_name,
      latitude: String(cam.latitude || ''),
      longitude: String(cam.longitude || ''),
      stream_url: cam.stream_url || '',
      zone: cam.zone || '',
    });
    setModalVisible(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.location_name.trim()) {
      Alert.alert('Required', 'Name and location are required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
      };
      if (editCam) {
        await camerasApi.update(editCam.id, payload);
      } else {
        await camerasApi.create(payload);
      }
      setModalVisible(false);
      load();
    } catch (e) {
      const msg = e.response?.data
        ? Object.values(e.response.data).flat().join('\n')
        : 'Failed to save camera.';
      Alert.alert('Error', msg);
    }
    setSaving(false);
  }

  async function handleDelete(cam) {
    Alert.alert('Delete Camera', `Remove "${cam.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await camerasApi.remove(cam.id);
            setCameras((prev) => prev.filter((c) => c.id !== cam.id));
          } catch {
            Alert.alert('Error', 'Could not delete camera.');
          }
        },
      },
    ]);
  }

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={[styles.camIcon, { backgroundColor: item.is_active ? colors.successBg : colors.bgElevated }]}>
          <Ionicons name="videocam" size={20} color={item.is_active ? colors.success : colors.textMuted} />
        </View>
        <View style={styles.camInfo}>
          <Text style={styles.camName}>{item.name}</Text>
          <Text style={styles.camLocation}>{item.location_name}</Text>
          {item.zone && <Text style={styles.camZone}>Zone: {item.zone}</Text>}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.is_active ? colors.successBg : '#1f2937' }]}>
          <Text style={[styles.statusText, { color: item.is_active ? colors.success : colors.textMuted }]}>
            {item.is_active ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      {item.stream_url && (
        <Text style={styles.streamUrl} numberOfLines={1}>{item.stream_url}</Text>
      )}

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
          <Ionicons name="pencil" size={14} color={colors.primaryLight} />
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
          <Ionicons name="trash" size={14} color={colors.danger} />
          <Text style={styles.deleteBtnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Camera Management</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={cameras}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="camera-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>No cameras registered</Text>
              <TouchableOpacity style={styles.emptyAddBtn} onPress={openAdd}>
                <Text style={styles.emptyAddText}>+ Add First Camera</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editCam ? 'Edit Camera' : 'Add Camera'}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
            {[
              { key: 'name', label: 'Camera Name *', placeholder: 'Main Entrance Camera' },
              { key: 'location_name', label: 'Location *', placeholder: 'e.g. Delhi Central Station' },
              { key: 'stream_url', label: 'Stream URL (RTSP/HLS)', placeholder: 'rtsp://camera-ip:554/stream', autoCapitalize: 'none' },
              { key: 'zone', label: 'Zone', placeholder: 'e.g. Zone A' },
              { key: 'latitude', label: 'Latitude', placeholder: '28.6139', keyboardType: 'decimal-pad' },
              { key: 'longitude', label: 'Longitude', placeholder: '77.2090', keyboardType: 'decimal-pad' },
            ].map((f) => (
              <View key={f.key} style={styles.field}>
                <Text style={styles.fieldLabel}>{f.label}</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={form[f.key]}
                  onChangeText={set(f.key)}
                  placeholder={f.placeholder}
                  placeholderTextColor={colors.textMuted}
                  keyboardType={f.keyboardType || 'default'}
                  autoCapitalize={f.autoCapitalize || 'words'}
                  autoCorrect={false}
                />
              </View>
            ))}

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>{editCam ? 'Save Changes' : 'Register Camera'}</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  title: { fontSize: fonts.xl, fontWeight: '700', color: colors.textPrimary },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primary, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: fonts.sm },
  list: { padding: spacing.md, gap: 12 },
  card: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  camIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  camInfo: { flex: 1 },
  camName: { fontSize: fonts.base, fontWeight: '700', color: colors.textPrimary },
  camLocation: { fontSize: fonts.xs, color: colors.textSecondary, marginTop: 2 },
  camZone: { fontSize: fonts.xs, color: colors.textMuted, marginTop: 2 },
  statusBadge: { borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: fonts.xs, fontWeight: '700' },
  streamUrl: { fontSize: fonts.xs, color: colors.textMuted, marginBottom: 10, paddingHorizontal: 4 },
  cardActions: { flexDirection: 'row', gap: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border },
  editBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: 8, borderRadius: radius.md, backgroundColor: colors.primaryDark + '44',
    borderWidth: 1, borderColor: colors.primaryDark,
  },
  editBtnText: { fontSize: fonts.xs, color: colors.primaryLight, fontWeight: '600' },
  deleteBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: 8, borderRadius: radius.md, backgroundColor: colors.dangerBg,
    borderWidth: 1, borderColor: colors.danger + '44',
  },
  deleteBtnText: { fontSize: fonts.xs, color: colors.danger, fontWeight: '600' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 16 },
  emptyText: { fontSize: fonts.base, color: colors.textMuted },
  emptyAddBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: 20, paddingVertical: 10 },
  emptyAddText: { color: '#fff', fontWeight: '700' },
  modal: { flex: 1, backgroundColor: colors.bg },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  modalTitle: { fontSize: fonts.lg, fontWeight: '700', color: colors.textPrimary },
  modalScroll: { padding: spacing.lg, gap: 0 },
  field: { marginBottom: spacing.md },
  fieldLabel: { fontSize: fonts.sm, color: colors.textSecondary, fontWeight: '600', marginBottom: 6 },
  fieldInput: {
    backgroundColor: colors.bgInput, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.sm, color: colors.textPrimary, fontSize: fonts.base,
    height: 48,
  },
  saveBtn: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    padding: 14, alignItems: 'center', marginTop: spacing.md,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: fonts.md },
});
