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
import { timeAgo } from '../../utils/helpers';

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { lastAlert } = useSocket();

  const load = useCallback(async () => {
    try {
      const { data } = await alertsApi.notifications();
      setNotifications(data.results ?? data);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (lastAlert) load(); }, [lastAlert]);

  async function markRead(id) {
    try {
      await alertsApi.markRead(id);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    } catch {}
  }

  async function markAllRead() {
    const unread = notifications.filter((n) => !n.is_read);
    await Promise.allSettled(unread.map((n) => alertsApi.markRead(n.id)));
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, !item.is_read && styles.cardUnread]}
      onPress={async () => {
        if (!item.is_read) await markRead(item.id);
        if (item.alert?.id) {
          navigation.navigate('Alerts', { screen: 'AlertDetail', params: { alertId: item.alert.id } });
        }
      }}
      activeOpacity={0.8}
    >
      <View style={[styles.dot, item.is_read && styles.dotRead]} />
      <View style={styles.iconWrap}>
        <Ionicons name="warning" size={20} color={item.is_read ? colors.textMuted : colors.warning} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.notifTitle, item.is_read && styles.textRead]}>
          Missing Person Alert
        </Text>
        <Text style={styles.notifBody} numberOfLines={2}>
          {item.alert?.missing_person?.name} detected at {item.alert?.camera?.location_name || 'unknown location'}
          {' '}with {Math.round((item.alert?.confidence_score || 0) * 100)}% confidence.
        </Text>
        <Text style={styles.time}>{timeAgo(item.sent_at)}</Text>
      </View>
      {!item.is_read && (
        <View style={styles.unreadBadge} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {unreadCount > 0 && (
        <View style={styles.unreadBanner}>
          <Ionicons name="notifications" size={16} color={colors.warning} />
          <Text style={styles.unreadBannerText}>{unreadCount} unread notification{unreadCount > 1 ? 's' : ''}</Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="notifications-off-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>No notifications yet</Text>
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
  markAllBtn: { padding: 8 },
  markAllText: { fontSize: fonts.sm, color: colors.primaryLight, fontWeight: '600' },
  unreadBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.warningBg, padding: spacing.sm, paddingHorizontal: spacing.lg,
  },
  unreadBannerText: { fontSize: fonts.sm, color: colors.warning, fontWeight: '600' },
  list: { padding: spacing.md, gap: 8 },
  card: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    padding: spacing.md, borderWidth: 1, borderColor: colors.border,
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
  },
  cardUnread: { borderColor: colors.warning + '44', backgroundColor: colors.warningBg + '33' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.warning, marginTop: 6 },
  dotRead: { backgroundColor: colors.textMuted },
  iconWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.bgElevated, alignItems: 'center', justifyContent: 'center',
  },
  content: { flex: 1 },
  notifTitle: { fontSize: fonts.base, fontWeight: '700', color: colors.textPrimary },
  textRead: { color: colors.textSecondary },
  notifBody: { fontSize: fonts.sm, color: colors.textSecondary, marginTop: 3, lineHeight: 18 },
  time: { fontSize: fonts.xs, color: colors.textMuted, marginTop: 6 },
  unreadBadge: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 6 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: fonts.base, color: colors.textMuted },
});
