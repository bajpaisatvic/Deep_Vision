import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { casesApi } from '../../api/casesApi';
import { colors, spacing, radius, fonts } from '../../theme';
import { timeAgo } from '../../utils/helpers';
import { CASE_STATUS } from '../../config';

function StatCard({ label, value, color, icon }) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function CitizenDashboard({ navigation }) {
  const { user, logout } = useAuth();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await casesApi.list();
      setCases(data.results ?? data);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const stats = {
    total: cases.length,
    active: cases.filter((c) => c.status === CASE_STATUS.ACTIVE).length,
    found: cases.filter((c) => c.status === CASE_STATUS.FOUND).length,
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <LinearGradient colors={['#0d1a2e', '#0a0f1e']} style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.first_name || user?.username} 👋</Text>
          <Text style={styles.headerSub}>Track your missing person reports</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
      >
        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard label="Total Cases" value={stats.total} color={colors.primaryLight} icon="folder-open" />
          <StatCard label="Active" value={stats.active} color={colors.warning} icon="time" />
          <StatCard label="Found" value={stats.found} color={colors.success} icon="checkmark-circle" />
        </View>

        {/* Quick actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Report')}>
              <LinearGradient colors={['#8b5cf6', '#6d28d9']} style={styles.actionGradient}>
                <Ionicons name="add-circle" size={28} color="#fff" />
                <Text style={styles.actionText}>Report Missing</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('My Cases')}>
              <LinearGradient colors={['#1a56db', '#1240a8']} style={styles.actionGradient}>
                <Ionicons name="list" size={28} color="#fff" />
                <Text style={styles.actionText}>My Cases</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent cases */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Reports</Text>
          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
          ) : cases.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={40} color={colors.textMuted} />
              <Text style={styles.emptyText}>No cases reported yet</Text>
              <Text style={styles.emptySubText}>Tap "Report Missing" to create your first report</Text>
            </View>
          ) : (
            cases.slice(0, 5).map((c) => (
              <TouchableOpacity
                key={c.id}
                style={styles.caseCard}
                onPress={() => navigation.navigate('My Cases', { screen: 'CaseDetail', params: { caseId: c.id } })}
              >
                <View style={styles.caseCardLeft}>
                  <Text style={styles.caseName}>{c.name}</Text>
                  <Text style={styles.caseMeta}>{c.age} yrs • {c.gender}</Text>
                  <Text style={styles.caseTime}>{timeAgo(c.registered_at)}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusBg(c.status) }]}>
                  <Text style={[styles.statusText, { color: statusColor(c.status) }]}>{c.status}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
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
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: fonts.lg, fontWeight: '700', color: colors.textPrimary },
  headerSub: { fontSize: fonts.sm, color: colors.textSecondary, marginTop: 2 },
  logoutBtn: { padding: 8 },
  scroll: { flex: 1 },
  statsRow: { flexDirection: 'row', padding: spacing.md, gap: 10 },
  statCard: {
    flex: 1, backgroundColor: colors.bgCard, borderRadius: radius.lg,
    padding: spacing.md, alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: colors.border, borderLeftWidth: 3,
  },
  statValue: { fontSize: fonts.xl, fontWeight: '800' },
  statLabel: { fontSize: fonts.xs, color: colors.textSecondary, textAlign: 'center' },
  section: { paddingHorizontal: spacing.md, marginBottom: spacing.md },
  sectionTitle: { fontSize: fonts.md, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm },
  actionsRow: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, borderRadius: radius.lg, overflow: 'hidden' },
  actionGradient: { padding: spacing.md, alignItems: 'center', gap: 8, minHeight: 90, justifyContent: 'center' },
  actionText: { color: '#fff', fontWeight: '700', fontSize: fonts.sm },
  caseCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    padding: spacing.md, marginBottom: 10,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  caseCardLeft: { flex: 1 },
  caseName: { fontSize: fonts.base, fontWeight: '700', color: colors.textPrimary },
  caseMeta: { fontSize: fonts.sm, color: colors.textSecondary, marginTop: 2 },
  caseTime: { fontSize: fonts.xs, color: colors.textMuted, marginTop: 4 },
  statusBadge: { borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: fonts.xs, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: spacing.xl, gap: 10 },
  emptyText: { fontSize: fonts.base, fontWeight: '600', color: colors.textSecondary },
  emptySubText: { fontSize: fonts.sm, color: colors.textMuted, textAlign: 'center' },
});
