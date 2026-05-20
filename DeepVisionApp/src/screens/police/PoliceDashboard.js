import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { casesApi } from '../../api/casesApi';
import { alertsApi } from '../../api/alertsApi';
import { colors, spacing, radius, fonts } from '../../theme';
import { timeAgo, confidenceColor, confidenceLabel } from '../../utils/helpers';

function StatCard({ label, value, color, icon, sub }) {
  return (
    <View style={[styles.statCard, { borderTopColor: color }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sub && <Text style={styles.statSub}>{sub}</Text>}
    </View>
  );
}

export default function PoliceDashboard({ navigation }) {
  const { user, logout } = useAuth();
  const { connected, lastAlert } = useSocket();
  const [cases, setCases] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [caseRes, alertRes] = await Promise.all([
        casesApi.list(),
        alertsApi.list({ status: 'PENDING' }),
      ]);
      setCases(caseRes.data.results ?? caseRes.data);
      setAlerts(alertRes.data.results ?? alertRes.data);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (lastAlert) load(); }, [lastAlert]);

  const stats = {
    totalCases: cases.length,
    activeCases: cases.filter((c) => c.status === 'ACTIVE').length,
    pendingAlerts: alerts.length,
    foundToday: cases.filter((c) => c.status === 'FOUND').length,
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <LinearGradient colors={['#0d1a2e', '#0a0f1e']} style={styles.header}>
        <View>
          <View style={styles.headerRow}>
            <View style={styles.badgeRow}>
              <Ionicons name="shield" size={16} color={colors.police} />
              <Text style={styles.roleBadge}>POLICE OFFICER</Text>
            </View>
            <View style={[styles.socketDot, { backgroundColor: connected ? colors.success : colors.danger }]} />
          </View>
          <Text style={styles.greeting}>Officer {user?.last_name || user?.username}</Text>
          <Text style={styles.badge}>Badge: {user?.badge_number || 'N/A'} • Zone: {user?.assigned_zone || 'All Zones'}</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </LinearGradient>

      {/* Live alert banner */}
      {lastAlert && (
        <TouchableOpacity
          style={styles.alertBanner}
          onPress={() => navigation.navigate('Alerts')}
        >
          <Ionicons name="warning" size={18} color={colors.warning} />
          <Text style={styles.alertBannerText} numberOfLines={1}>
            NEW: {lastAlert.missing_person_name} detected at {lastAlert.camera_location}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.warning} />
        </TouchableOpacity>
      )}

      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
      >
        {/* Stats */}
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ margin: spacing.xl }} />
        ) : (
          <View style={styles.statsGrid}>
            <StatCard label="Active Cases" value={stats.activeCases} color={colors.warning} icon="alert-circle" />
            <StatCard label="Pending Alerts" value={stats.pendingAlerts} color={colors.danger} icon="warning" />
            <StatCard label="Total Cases" value={stats.totalCases} color={colors.primaryLight} icon="folder-open" />
            <StatCard label="Found" value={stats.foundToday} color={colors.success} icon="checkmark-circle" />
          </View>
        )}

        {/* Quick actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {[
              { label: 'View Alerts', icon: 'warning', color: colors.danger, nav: 'Alerts' },
              { label: 'All Cases', icon: 'folder-open', color: colors.primaryLight, nav: 'Cases' },
              { label: 'Live Feed', icon: 'videocam', color: colors.success, nav: 'Live' },
              { label: 'Notifications', icon: 'notifications', color: colors.warning, nav: 'Notifications' },
            ].map((a) => (
              <TouchableOpacity key={a.label} style={styles.actionCard} onPress={() => navigation.navigate(a.nav)}>
                <View style={[styles.actionIcon, { backgroundColor: a.color + '22' }]}>
                  <Ionicons name={a.icon} size={24} color={a.color} />
                </View>
                <Text style={styles.actionLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent pending alerts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pending Alerts</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Alerts')}>
              <Text style={styles.seeAll}>See all →</Text>
            </TouchableOpacity>
          </View>
          {alerts.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="checkmark-done" size={32} color={colors.success} />
              <Text style={styles.emptyText}>No pending alerts</Text>
            </View>
          ) : (
            alerts.slice(0, 3).map((a) => (
              <TouchableOpacity
                key={a.id}
                style={styles.alertCard}
                onPress={() => navigation.navigate('Alerts', { screen: 'AlertDetail', params: { alertId: a.id } })}
              >
                <View style={[styles.confBadge, { backgroundColor: confidenceColor(a.confidence_score) + '22' }]}>
                  <Text style={[styles.confText, { color: confidenceColor(a.confidence_score) }]}>
                    {Math.round(a.confidence_score * 100)}%
                  </Text>
                </View>
                <View style={styles.alertInfo}>
                  <Text style={styles.alertName}>{a.missing_person?.name}</Text>
                  <Text style={styles.alertCamera}>{a.camera?.name} • {a.camera?.location_name}</Text>
                  <Text style={styles.alertTime}>{timeAgo(a.detected_at)}</Text>
                </View>
                <View style={[styles.confLabel, { backgroundColor: confidenceColor(a.confidence_score) + '22' }]}>
                  <Text style={[styles.confLabelText, { color: confidenceColor(a.confidence_score) }]}>
                    {confidenceLabel(a.confidence_score)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { padding: spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  roleBadge: { fontSize: fonts.xs, color: colors.police, fontWeight: '700', letterSpacing: 1 },
  socketDot: { width: 8, height: 8, borderRadius: 4 },
  greeting: { fontSize: fonts.lg, fontWeight: '800', color: colors.textPrimary },
  badge: { fontSize: fonts.xs, color: colors.textSecondary, marginTop: 2 },
  logoutBtn: { padding: 8 },
  alertBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.warningBg, padding: spacing.sm, paddingHorizontal: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.warning + '44',
  },
  alertBannerText: { flex: 1, color: colors.warning, fontWeight: '600', fontSize: fonts.sm },
  scroll: { flex: 1 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: spacing.sm, gap: 10, paddingHorizontal: spacing.md },
  statCard: {
    width: '47%', backgroundColor: colors.bgCard, borderRadius: radius.lg,
    padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderTopWidth: 3,
    alignItems: 'center', gap: 4,
  },
  statIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: fonts.xl, fontWeight: '800' },
  statLabel: { fontSize: fonts.xs, color: colors.textSecondary, textAlign: 'center' },
  statSub: { fontSize: fonts.xs, color: colors.textMuted },
  section: { paddingHorizontal: spacing.md, marginBottom: spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  sectionTitle: { fontSize: fonts.md, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm },
  seeAll: { fontSize: fonts.sm, color: colors.primaryLight, fontWeight: '600' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCard: {
    width: '47%', backgroundColor: colors.bgCard, borderRadius: radius.lg,
    padding: spacing.md, alignItems: 'center', gap: 10,
    borderWidth: 1, borderColor: colors.border,
  },
  actionIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: fonts.sm, color: colors.textSecondary, fontWeight: '600', textAlign: 'center' },
  empty: { alignItems: 'center', padding: spacing.lg, gap: 10 },
  emptyText: { color: colors.textMuted, fontSize: fonts.sm },
  alertCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    padding: spacing.md, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  confBadge: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  confText: { fontSize: fonts.sm, fontWeight: '800' },
  alertInfo: { flex: 1 },
  alertName: { fontSize: fonts.base, fontWeight: '700', color: colors.textPrimary },
  alertCamera: { fontSize: fonts.xs, color: colors.textSecondary, marginTop: 2 },
  alertTime: { fontSize: fonts.xs, color: colors.textMuted, marginTop: 4 },
  confLabel: { borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  confLabelText: { fontSize: fonts.xs, fontWeight: '700' },
});
