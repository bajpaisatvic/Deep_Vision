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
import { camerasApi } from '../../api/camerasApi';
import { colors, spacing, radius, fonts } from '../../theme';
import { timeAgo } from '../../utils/helpers';

function StatCard({ label, value, color, icon }) {
  return (
    <View style={[styles.statCard, { borderTopColor: color }]}>
      <View style={[styles.statIconWrap, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function AdminDashboard({ navigation }) {
  const { user, logout } = useAuth();
  const { connected, lastAlert } = useSocket();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ cases: 0, active: 0, alerts: 0, cameras: 0, found: 0 });
  const [recentAlerts, setRecentAlerts] = useState([]);

  const load = useCallback(async () => {
    try {
      const [caseRes, alertRes, camRes] = await Promise.all([
        casesApi.list(),
        alertsApi.list(),
        camerasApi.list(),
      ]);
      const caseList = caseRes.data.results ?? caseRes.data;
      const alertList = alertRes.data.results ?? alertRes.data;
      const camList = camRes.data.results ?? camRes.data;
      setStats({
        cases: caseList.length,
        active: caseList.filter((c) => c.status === 'ACTIVE').length,
        alerts: alertList.filter((a) => a.status === 'PENDING').length,
        cameras: camList.filter((c) => c.is_active).length,
        found: caseList.filter((c) => c.status === 'FOUND').length,
      });
      setRecentAlerts(alertList.slice(0, 5));
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (lastAlert) load(); }, [lastAlert]);

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={['#1a0000', '#0a0f1e']} style={styles.header}>
        <View>
          <View style={styles.headerRow}>
            <View style={styles.adminBadgeRow}>
              <Ionicons name="shield-checkmark" size={16} color={colors.admin} />
              <Text style={styles.adminBadgeText}>SYSTEM ADMIN</Text>
            </View>
            <View style={[styles.socketDot, { backgroundColor: connected ? colors.success : colors.danger }]} />
          </View>
          <Text style={styles.greeting}>Admin: {user?.username}</Text>
          <Text style={styles.sub}>Full system access</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </LinearGradient>

      {lastAlert && (
        <View style={styles.alertBanner}>
          <Ionicons name="warning" size={16} color={colors.warning} />
          <Text style={styles.alertBannerText} numberOfLines={1}>
            ALERT: {lastAlert.missing_person_name} at {lastAlert.camera_location}
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.admin} />}
      >
        {loading ? (
          <ActivityIndicator color={colors.admin} style={{ margin: spacing.xl }} />
        ) : (
          <>
            {/* System stats */}
            <View style={styles.statsGrid}>
              <StatCard label="Active Cases" value={stats.active} color={colors.warning} icon="alert-circle" />
              <StatCard label="Pending Alerts" value={stats.alerts} color={colors.danger} icon="warning" />
              <StatCard label="Active Cameras" value={stats.cameras} color={colors.primaryLight} icon="videocam" />
              <StatCard label="Found" value={stats.found} color={colors.success} icon="checkmark-circle" />
            </View>

            {/* Total cases */}
            <View style={styles.totalCard}>
              <Ionicons name="folder-open" size={24} color={colors.textSecondary} />
              <View>
                <Text style={styles.totalValue}>{stats.cases}</Text>
                <Text style={styles.totalLabel}>Total Cases in System</Text>
              </View>
            </View>

            {/* Admin actions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Admin Controls</Text>
              <View style={styles.actionsGrid}>
                {[
                  { label: 'Camera Mgmt', icon: 'camera', color: colors.primaryLight, nav: 'Cameras' },
                  { label: 'All Alerts', icon: 'warning', color: colors.danger, nav: 'Alerts' },
                  { label: 'All Cases', icon: 'folder-open', color: colors.warning, nav: 'Cases' },
                  { label: 'Live Feed', icon: 'videocam', color: colors.success, nav: 'Live' },
                  { label: 'Notifications', icon: 'notifications', color: colors.info, nav: 'Notifs' },
                ].map((a) => (
                  <TouchableOpacity key={a.label} style={styles.actionCard} onPress={() => navigation.navigate(a.nav)}>
                    <View style={[styles.actionIcon, { backgroundColor: a.color + '22' }]}>
                      <Ionicons name={a.icon} size={22} color={a.color} />
                    </View>
                    <Text style={styles.actionLabel}>{a.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Recent alerts */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Alerts</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Alerts')}>
                  <Text style={styles.seeAll}>View all →</Text>
                </TouchableOpacity>
              </View>
              {recentAlerts.length === 0 ? (
                <View style={styles.empty}>
                  <Ionicons name="checkmark-done" size={32} color={colors.success} />
                  <Text style={styles.emptyText}>No recent alerts</Text>
                </View>
              ) : (
                recentAlerts.map((a) => (
                  <TouchableOpacity
                    key={a.id}
                    style={styles.alertRow}
                    onPress={() => navigation.navigate('Alerts', { screen: 'AlertDetail', params: { alertId: a.id } })}
                  >
                    <View style={[styles.statusDot, { backgroundColor: a.status === 'PENDING' ? colors.warning : a.status === 'VERIFIED' ? colors.success : colors.textMuted }]} />
                    <View style={styles.alertInfo}>
                      <Text style={styles.alertName}>{a.missing_person?.name}</Text>
                      <Text style={styles.alertMeta}>{Math.round(a.confidence_score * 100)}% • {a.camera?.location_name}</Text>
                    </View>
                    <Text style={styles.alertTime}>{timeAgo(a.detected_at)}</Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { padding: spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  adminBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  adminBadgeText: { fontSize: fonts.xs, color: colors.admin, fontWeight: '700', letterSpacing: 1 },
  socketDot: { width: 8, height: 8, borderRadius: 4 },
  greeting: { fontSize: fonts.lg, fontWeight: '800', color: colors.textPrimary },
  sub: { fontSize: fonts.xs, color: colors.textSecondary, marginTop: 2 },
  logoutBtn: { padding: 8 },
  alertBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.warningBg, padding: spacing.sm, paddingHorizontal: spacing.md,
  },
  alertBannerText: { flex: 1, color: colors.warning, fontWeight: '600', fontSize: fonts.sm },
  scroll: { flex: 1 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: spacing.sm, gap: 10, paddingHorizontal: spacing.md },
  statCard: {
    width: '47%', backgroundColor: colors.bgCard, borderRadius: radius.lg,
    padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderTopWidth: 3,
    alignItems: 'center', gap: 6,
  },
  statIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: fonts.xl, fontWeight: '800' },
  statLabel: { fontSize: fonts.xs, color: colors.textSecondary, textAlign: 'center' },
  totalCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    padding: spacing.md, marginHorizontal: spacing.md, marginBottom: 4,
    borderWidth: 1, borderColor: colors.border,
  },
  totalValue: { fontSize: fonts.xxl, fontWeight: '800', color: colors.textPrimary },
  totalLabel: { fontSize: fonts.sm, color: colors.textSecondary },
  section: { padding: spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  sectionTitle: { fontSize: fonts.md, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm },
  seeAll: { fontSize: fonts.sm, color: colors.primaryLight, fontWeight: '600' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCard: {
    width: '30%', backgroundColor: colors.bgCard, borderRadius: radius.lg,
    padding: spacing.md, alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: colors.border,
  },
  actionIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: fonts.xs, color: colors.textSecondary, fontWeight: '600', textAlign: 'center' },
  alertRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  alertInfo: { flex: 1 },
  alertName: { fontSize: fonts.sm, fontWeight: '700', color: colors.textPrimary },
  alertMeta: { fontSize: fonts.xs, color: colors.textSecondary },
  alertTime: { fontSize: fonts.xs, color: colors.textMuted },
  empty: { alignItems: 'center', padding: spacing.md, gap: 8 },
  emptyText: { color: colors.textMuted, fontSize: fonts.sm },
});
