import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Image,
  ActivityIndicator, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { casesApi } from '../../api/casesApi';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, radius, fonts } from '../../theme';
import { formatDate, timeAgo } from '../../utils/helpers';
import { ROLES } from '../../config';
import { CASE_STATUS } from '../../config';

export default function CaseDetailScreen({ route, navigation }) {
  const { caseId } = route.params;
  const { user } = useAuth();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    casesApi.detail(caseId)
      .then(({ data }) => setCaseData(data))
      .catch(() => Alert.alert('Error', 'Could not load case.'))
      .finally(() => setLoading(false));
  }, [caseId]);

  async function handleStatusUpdate(newStatus) {
    Alert.alert('Update Status', `Mark case as ${newStatus}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm', onPress: async () => {
          setUpdating(true);
          try {
            const { data } = await casesApi.updateStatus(caseId, newStatus);
            setCaseData(data);
          } catch {
            Alert.alert('Error', 'Could not update status.');
          }
          setUpdating(false);
        },
      },
    ]);
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>;
  if (!caseData) return null;

  const canUpdateStatus = user?.role === ROLES.POLICE || user?.role === ROLES.ADMIN;
  const primaryImage = caseData.images?.find((i) => i.is_primary) || caseData.images?.[0];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Case #{caseData.id}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusBg(caseData.status) }]}>
          <Text style={[styles.statusText, { color: statusColor(caseData.status) }]}>{caseData.status}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Photo */}
        {primaryImage && (
          <Image
            source={{ uri: primaryImage.image_url }}
            style={styles.photo}
            resizeMode="cover"
          />
        )}

        {/* Info card */}
        <View style={styles.card}>
          <Text style={styles.name}>{caseData.name}</Text>
          <View style={styles.metaRow}>
            <MetaItem icon="person" value={`${caseData.age} yrs • ${caseData.gender}`} />
            <MetaItem icon="time" value={timeAgo(caseData.registered_at)} />
          </View>

          {caseData.last_seen_location && (
            <MetaItem icon="location" value={caseData.last_seen_location} full />
          )}
          {caseData.last_seen_time && (
            <MetaItem icon="calendar" value={formatDate(caseData.last_seen_time)} full />
          )}
          {caseData.description && (
            <View style={styles.descWrap}>
              <Text style={styles.descLabel}>Description</Text>
              <Text style={styles.descText}>{caseData.description}</Text>
            </View>
          )}
        </View>

        {/* All photos */}
        {caseData.images?.length > 1 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Uploaded Photos ({caseData.images.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
              {caseData.images.map((img) => (
                <Image
                  key={img.id}
                  source={{ uri: img.image_url }}
                  style={styles.thumbnail}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Status management (police/admin only) */}
        {canUpdateStatus && caseData.status === CASE_STATUS.ACTIVE && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Case Management</Text>
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.successBg, borderColor: colors.success }]}
                onPress={() => handleStatusUpdate(CASE_STATUS.FOUND)}
                disabled={updating}
              >
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <Text style={[styles.actionBtnText, { color: colors.success }]}>Mark Found</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#1f2937', borderColor: colors.textMuted }]}
                onPress={() => handleStatusUpdate(CASE_STATUS.CLOSED)}
                disabled={updating}
              >
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                <Text style={[styles.actionBtnText, { color: colors.textMuted }]}>Close Case</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function MetaItem({ icon, value, full }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }, full && { width: '100%' }]}>
      <Ionicons name={`${icon}-outline`} size={14} color={colors.textMuted} />
      <Text style={{ fontSize: fonts.sm, color: colors.textSecondary, flex: 1 }}>{value}</Text>
    </View>
  );
}

function statusColor(s) {
  return { ACTIVE: colors.warning, FOUND: colors.success, CLOSED: colors.textMuted }[s] || colors.textMuted;
}
function statusBg(s) {
  return { ACTIVE: colors.warningBg, FOUND: colors.successBg, CLOSED: '#1f2937' }[s] || '#1f2937';
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border, gap: 12,
  },
  back: { padding: 4 },
  headerTitle: { flex: 1, fontSize: fonts.md, fontWeight: '700', color: colors.textPrimary },
  statusBadge: { borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: fonts.xs, fontWeight: '700' },
  scroll: { padding: spacing.md, gap: 12 },
  photo: { width: '100%', height: 280, borderRadius: radius.xl, backgroundColor: colors.bgElevated },
  card: { backgroundColor: colors.bgCard, borderRadius: radius.xl, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  name: { fontSize: fonts.xl, fontWeight: '800', color: colors.textPrimary },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 6 },
  descWrap: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  descLabel: { fontSize: fonts.sm, color: colors.textMuted, fontWeight: '600', marginBottom: 6 },
  descText: { fontSize: fonts.base, color: colors.textSecondary, lineHeight: 22 },
  sectionTitle: { fontSize: fonts.base, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm },
  photoScroll: { marginTop: 4 },
  thumbnail: { width: 80, height: 80, borderRadius: radius.md, marginRight: 8, backgroundColor: colors.bgElevated },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, padding: 12, borderRadius: radius.md, borderWidth: 1,
  },
  actionBtnText: { fontWeight: '700', fontSize: fonts.sm },
});
