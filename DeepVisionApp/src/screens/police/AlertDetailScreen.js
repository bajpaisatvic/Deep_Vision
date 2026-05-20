import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Image,
  ActivityIndicator, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { alertsApi } from '../../api/alertsApi';
import { colors, spacing, radius, fonts, shadows } from '../../theme';
import { formatDate, confidenceColor, confidenceLabel } from '../../utils/helpers';
import { ALERT_STATUS } from '../../config';

export default function AlertDetailScreen({ route, navigation }) {
  const { alertId } = route.params;
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    alertsApi.detail(alertId)
      .then(({ data }) => setAlert(data))
      .catch(() => Alert.alert('Error', 'Could not load alert.'))
      .finally(() => setLoading(false));
  }, [alertId]);

  async function handleVerify(status) {
    const label = status === ALERT_STATUS.VERIFIED ? 'verify' : 'dismiss';
    Alert.alert(
      `${status === ALERT_STATUS.VERIFIED ? 'Verify' : 'Dismiss'} Alert`,
      status === ALERT_STATUS.VERIFIED
        ? 'This will mark the missing person as FOUND and exclude them from future scans.'
        : 'This alert will be marked as a false positive.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: status === ALERT_STATUS.DISMISSED ? 'destructive' : 'default',
          onPress: async () => {
            setUpdating(true);
            try {
              const { data } = await alertsApi.verify(alertId, status);
              setAlert(data);
            } catch {
              Alert.alert('Error', 'Could not update alert.');
            }
            setUpdating(false);
          },
        },
      ],
    );
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>;
  if (!alert) return null;

  const isPending = alert.status === ALERT_STATUS.PENDING;
  const conf = alert.confidence_score;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Alert #{alert.id}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusBg(alert.status) }]}>
          <Text style={[styles.statusText, { color: statusColor(alert.status) }]}>{alert.status}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Snapshot */}
        {alert.snapshot_url ? (
          <View style={styles.snapshotWrap}>
            <Image
              source={{ uri: alert.snapshot_url }}
              style={styles.snapshot}
              resizeMode="cover"
            />
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.snapshotOverlay}>
              <View style={[styles.confCircle, { borderColor: confidenceColor(conf) }]}>
                <Text style={[styles.confPct, { color: confidenceColor(conf) }]}>
                  {Math.round(conf * 100)}%
                </Text>
                <Text style={[styles.confLabel, { color: confidenceColor(conf) }]}>
                  {confidenceLabel(conf)}
                </Text>
              </View>
            </LinearGradient>
          </View>
        ) : (
          <View style={styles.noSnapshot}>
            <Ionicons name="camera-outline" size={48} color={colors.textMuted} />
            <Text style={styles.noSnapshotText}>No snapshot available</Text>
          </View>
        )}

        {/* Person info */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Missing Person</Text>
          <Text style={styles.personName}>{alert.missing_person?.name}</Text>
          <Text style={styles.personMeta}>
            {alert.missing_person?.age} yrs • {alert.missing_person?.gender} • Case #{alert.missing_person?.id}
          </Text>
        </View>

        {/* Detection info */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Detection Details</Text>
          <Row icon="videocam" label="Camera" value={alert.camera?.name || 'Unknown'} />
          <Row icon="location" label="Location" value={alert.camera?.location_name || '—'} />
          <Row icon="time" label="Detected" value={formatDate(alert.detected_at)} />
          <Row icon="analytics" label="Confidence" value={`${Math.round(conf * 100)}% (${confidenceLabel(conf)})`} valueColor={confidenceColor(conf)} />
        </View>

        {/* Verified by */}
        {alert.verified_by && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Verified By</Text>
            <Row icon="person" label="Officer" value={alert.verified_by?.username} />
            <Row icon="calendar" label="Verified At" value={formatDate(alert.verified_at)} />
          </View>
        )}

        {/* Actions */}
        {isPending && (
          <View style={styles.actionsCard}>
            <Text style={styles.actionsTitle}>Take Action</Text>
            <Text style={styles.actionsHint}>Review the snapshot carefully before taking action.</Text>
            {updating ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} />
            ) : (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.verifyBtn]}
                  onPress={() => handleVerify(ALERT_STATUS.VERIFIED)}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.actionBtnText}>Verify — Person Found</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.dismissBtn]}
                  onPress={() => handleVerify(ALERT_STATUS.DISMISSED)}
                >
                  <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                  <Text style={[styles.actionBtnText, { color: colors.textSecondary }]}>Dismiss (False Positive)</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ icon, label, value, valueColor }) {
  return (
    <View style={rowStyles.row}>
      <Ionicons name={`${icon}-outline`} size={16} color={colors.textMuted} style={rowStyles.icon} />
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={[rowStyles.value, valueColor && { color: valueColor }]}>{value}</Text>
    </View>
  );
}
const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  icon: { marginRight: 10 },
  label: { flex: 1, fontSize: fonts.sm, color: colors.textSecondary, fontWeight: '600' },
  value: { fontSize: fonts.sm, color: colors.textPrimary, flex: 1, textAlign: 'right' },
});

function statusColor(s) {
  return { PENDING: colors.warning, VERIFIED: colors.success, DISMISSED: colors.textMuted }[s] || colors.textMuted;
}
function statusBg(s) {
  return { PENDING: colors.warningBg, VERIFIED: colors.successBg, DISMISSED: '#1f2937' }[s] || '#1f2937';
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
  snapshotWrap: { borderRadius: radius.xl, overflow: 'hidden', height: 260 },
  snapshot: { width: '100%', height: '100%' },
  snapshotOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 120,
    alignItems: 'flex-end', justifyContent: 'flex-end', padding: 16,
  },
  confCircle: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 3, backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  confPct: { fontSize: fonts.md, fontWeight: '800' },
  confLabel: { fontSize: fonts.xs, fontWeight: '600' },
  noSnapshot: {
    height: 160, backgroundColor: colors.bgCard, borderRadius: radius.xl,
    alignItems: 'center', justifyContent: 'center', gap: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  noSnapshotText: { color: colors.textMuted, fontSize: fonts.sm },
  card: { backgroundColor: colors.bgCard, borderRadius: radius.xl, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  sectionTitle: { fontSize: fonts.base, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm },
  personName: { fontSize: fonts.xl, fontWeight: '800', color: colors.textPrimary },
  personMeta: { fontSize: fonts.sm, color: colors.textSecondary, marginTop: 4 },
  actionsCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.xl, padding: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },
  actionsTitle: { fontSize: fonts.md, fontWeight: '700', color: colors.textPrimary },
  actionsHint: { fontSize: fonts.sm, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.md },
  actionRow: { gap: 10 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: 14, borderRadius: radius.md,
  },
  verifyBtn: { backgroundColor: colors.success },
  dismissBtn: { backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.border },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: fonts.base },
});
