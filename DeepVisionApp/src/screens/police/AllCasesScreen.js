import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { casesApi } from '../../api/casesApi';
import { colors, spacing, radius, fonts } from '../../theme';
import { timeAgo } from '../../utils/helpers';

const STATUS_FILTERS = ['ALL', 'ACTIVE', 'FOUND', 'CLOSED'];

export default function AllCasesScreen({ navigation }) {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await casesApi.list();
      setCases(data.results ?? data);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = cases.filter((c) => {
    if (filter !== 'ALL' && c.status !== filter) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

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
      <View style={styles.cardRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name?.[0]?.toUpperCase()}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.meta}>{item.age} yrs • {item.gender}</Text>
          {item.last_seen_location && (
            <Text style={styles.location} numberOfLines={1}>
              <Ionicons name="location-outline" size={11} color={colors.textMuted} /> {item.last_seen_location}
            </Text>
          )}
        </View>
        <View style={{ alignItems: 'flex-end', gap: 8 }}>
          <View style={[styles.badge, { backgroundColor: statusBg(item.status) }]}>
            <Text style={[styles.badgeText, { color: statusColor(item.status) }]}>{item.status}</Text>
          </View>
          <Text style={styles.time}>{timeAgo(item.registered_at)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>All Cases</Text>
        <Text style={styles.count}>{filtered.length} shown</Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name..."
          placeholderTextColor={colors.textMuted}
          autoCorrect={false}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ) : null}
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
              <Text style={styles.emptyText}>No cases found</Text>
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
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bgCard, margin: spacing.md,
    borderRadius: radius.lg, padding: spacing.sm,
    borderWidth: 1, borderColor: colors.border,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: colors.textPrimary, fontSize: fonts.base },
  filtersWrap: { flexDirection: 'row', paddingHorizontal: spacing.md, gap: 8, marginBottom: spacing.sm },
  filterBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.full,
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border,
  },
  filterBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { fontSize: fonts.xs, fontWeight: '600', color: colors.textSecondary },
  filterTextActive: { color: '#fff' },
  list: { padding: spacing.md, gap: 10 },
  card: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  cardRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primaryDark, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  avatarText: { color: '#fff', fontSize: fonts.md, fontWeight: '700' },
  info: { flex: 1 },
  name: { fontSize: fonts.base, fontWeight: '700', color: colors.textPrimary },
  meta: { fontSize: fonts.xs, color: colors.textSecondary, marginTop: 2 },
  location: { fontSize: fonts.xs, color: colors.textMuted, marginTop: 2 },
  badge: { borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: fonts.xs, fontWeight: '700' },
  time: { fontSize: fonts.xs, color: colors.textMuted },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: fonts.base, color: colors.textMuted },
});
