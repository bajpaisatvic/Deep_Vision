import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { casesApi } from '../../api/casesApi';
import { colors, spacing, radius, fonts } from '../../theme';
import { timeAgo } from '../../utils/helpers';
import { CASE_STATUS } from '../../config';

const STATUS_FILTERS = ['ALL', 'ACTIVE', 'FOUND', 'CLOSED'];

export default function MyCasesScreen({ navigation }) {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('ALL');

  const load = useCallback(async () => {
    try {
      const { data } = await casesApi.list();
      setCases(data.results ?? data);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === 'ALL' ? cases : cases.filter((c) => c.status === filter);

  function statusColor(s) {
    return { ACTIVE: colors.warning, FOUND: colors.success, CLOSED: colors.textMuted }[s] || colors.textMuted;
  }
  function statusBg(s) {
    return { ACTIVE: colors.warningBg, FOUND: colors.successBg, CLOSED: '#1f2937' }[s] || '#1f2937';
  }

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('CaseDetail', { caseId: item.id })}
      activeOpacity={0.8}
    >
      <View style={styles.cardTop}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name?.[0]?.toUpperCase()}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.meta}>{item.age} yrs • {item.gender} • {item.last_seen_location || 'Location unknown'}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: statusBg(item.status) }]}>
          <Text style={[styles.badgeText, { color: statusColor(item.status) }]}>{item.status}</Text>
        </View>
      </View>
      <View style={styles.cardBottom}>
        <Ionicons name="time-outline" size={13} color={colors.textMuted} />
        <Text style={styles.time}>{timeAgo(item.registered_at)}</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>My Cases</Text>
        <Text style={styles.count}>{cases.length} total</Text>
      </View>

      {/* Filters */}
      <View style={styles.filtersWrap}>
        {STATUS_FILTERS.map((f) => (
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
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="folder-open-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>No {filter !== 'ALL' ? filter.toLowerCase() : ''} cases found</Text>
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  title: { fontSize: fonts.xl, fontWeight: '700', color: colors.textPrimary },
  count: { fontSize: fonts.sm, color: colors.textMuted },
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
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primaryDark, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: fonts.md, fontWeight: '700' },
  info: { flex: 1 },
  name: { fontSize: fonts.base, fontWeight: '700', color: colors.textPrimary },
  meta: { fontSize: fonts.xs, color: colors.textSecondary, marginTop: 2 },
  badge: { borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: fonts.xs, fontWeight: '700' },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border },
  time: { fontSize: fonts.xs, color: colors.textMuted },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: fonts.base, color: colors.textMuted },
});
