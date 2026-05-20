import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { alertsApi } from '../../api/alertsApi';
import { useSocket } from '../../context/SocketContext';
import { colors, spacing, radius, fonts } from '../../theme';
import { timeAgo, confidenceColor, confidenceLabel } from '../../utils/helpers';

const FILTERS = ['ALL', 'PENDING', 'VERIFIED', 'DISMISSED'];

export default function AlertsListScreen({ navigation }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const { lastAlert } = useSocket();

  const load = useCallback(async () => {
    try {
      const params = filter !== 'ALL' ? { status: filter } : {};
      const { data } = await alertsApi.list(params);
      setAlerts(data.results ?? data);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (lastAlert) load(); }, [lastAlert]);

  function statusColor(s) {
    return { PENDING: colors.warning, VERIFIED: colors.success, DISMISSED: colors.textMuted }[s] || colors.textMuted;
  }
  function statusBg(s) {
    return { PENDING: colors.warningBg, VERIFIED: colors.successBg, DISMISSED: '#1f2937' }[s] || '#1f2937';
  }

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('AlertDetail', { alertId: item.id })}
      activeOpacity={0.8}
    >
      {/* Confidence ring */}
      <View style={[styles.confRing, { borderColor: confidenceColor(item.confidence_score) }]}>
        <Text style={[styles.confPct, { color: confidenceColor(item.confidence_score) }]}>
          {Math.round(item.confidence_score * 100)}%
        </Text>
        <Text style={[styles.confLbl, { color: confidenceColor(item.confidence_score) }]}>
          {confidenceLabel(item.confidence_score)}
        </Text>
      </View>

      <View style={styles.info}>
        <View style={styles.infoRow}>
          <Text style={styles.personName}>{item.missing_person?.name || '—'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusBg(item.status) }]}>
            <Text style={[styles.statusText, { color: statusColor(item.status) }]}>{item.status}</Text>
          </View>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="videocam-outline" size={12} color={colors.textMuted} />
          <Text style={styles.camera}>{item.camera?.name || 'Unknown Camera'}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={12} color={colors.textMuted} />
          <Text style={styles.camera}>{item.camera?.location_name || '—'}</Text>
        </View>
        <Text style={styles.time}>{timeAgo(item.detected_at)}</Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Detection Alerts</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{alerts.length}</Text>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersWrap}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="checkmark-done-outline" size={48} color={colors.success} />
              <Text style={styles.emptyText}>No {filter !== 'ALL' ? filter.toLowerCase() : ''} alerts</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  title: { flex: 1, fontSize: fonts.xl, fontWeight: '700', color: colors.textPrimary },
  countBadge: { backgroundColor: colors.danger, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  countText: { color: '#fff', fontSize: fonts.xs, fontWeight: '700' },
  filtersWrap: { flexDirection: 'row', padding: spacing.sm, gap: 8, paddingHorizontal: spacing.md },
  filterBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.full,
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border,
  },
  filterBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { fontSize: fonts.xs, fontWeight: '600', color: colors.textSecondary },
  filterTextActive: { color: '#fff' },
  list: { padding: spacing.md, gap: 12 },
  card: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    padding: spacing.md, borderWidth: 1, borderColor: colors.border,
    flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  confRing: {
    width: 60, height: 60, borderRadius: 30,
    borderWidth: 3, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  confPct: { fontSize: fonts.sm, fontWeight: '800' },
  confLbl: { fontSize: 9, fontWeight: '600' },
  info: { flex: 1 },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  personName: { fontSize: fonts.base, fontWeight: '700', color: colors.textPrimary, flex: 1 },
  statusBadge: { borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 8 },
  statusText: { fontSize: fonts.xs, fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  camera: { fontSize: fonts.xs, color: colors.textSecondary },
  time: { fontSize: fonts.xs, color: colors.textMuted, marginTop: 6 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: fonts.base, color: colors.textMuted },
});
