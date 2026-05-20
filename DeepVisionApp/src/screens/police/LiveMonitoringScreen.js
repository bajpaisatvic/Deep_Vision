import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { camerasApi } from '../../api/camerasApi';
import { colors, spacing, radius, fonts } from '../../theme';
import { useSocket } from '../../context/SocketContext';

export default function LiveMonitoringScreen() {
  const [cameras, setCameras] = useState([]);
  const [selectedCam, setSelectedCam] = useState(null);
  const [streaming, setStreaming] = useState(false);
  const [loadingCams, setLoadingCams] = useState(true);
  const { connected, lastAlert } = useSocket();

  const loadCameras = useCallback(async () => {
    try {
      const { data } = await camerasApi.list();
      const list = data.results ?? data;
      setCameras(list);
      if (list.length > 0 && !selectedCam) setSelectedCam(list[0]);
    } catch {}
    setLoadingCams(false);
  }, []);

  useEffect(() => { loadCameras(); }, [loadCameras]);

  async function startStream() {
    setStreaming(true);
  }

  async function stopStream() {
    if (selectedCam) {
      try { await camerasApi.stopStream(selectedCam.id); } catch {}
    }
    setStreaming(false);
  }

  async function runSimulation() {
    Alert.alert('Run Detection', 'Simulate a face detection scan on the live feed?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Run', onPress: async () => {
          try {
            await camerasApi.simulate();
            Alert.alert('Done', 'Detection simulation triggered. Check alerts for results.');
          } catch {
            Alert.alert('Error', 'Could not run simulation.');
          }
        },
      },
    ]);
  }

  const streamUrl = selectedCam ? camerasApi.streamUrl(selectedCam.id) : null;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Live Monitoring</Text>
        <View style={styles.headerRight}>
          <View style={[styles.socketDot, { backgroundColor: connected ? colors.success : colors.textMuted }]} />
          <Text style={styles.socketLabel}>{connected ? 'Connected' : 'Offline'}</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll}>
        {/* Camera selector */}
        {loadingCams ? (
          <ActivityIndicator color={colors.primary} style={{ margin: spacing.xl }} />
        ) : cameras.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="camera-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>No cameras registered</Text>
            <Text style={styles.emptySubText}>Ask an admin to add cameras</Text>
          </View>
        ) : (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.camSelector}>
              {cameras.map((cam) => (
                <TouchableOpacity
                  key={cam.id}
                  style={[styles.camChip, selectedCam?.id === cam.id && styles.camChipActive]}
                  onPress={() => { setSelectedCam(cam); setStreaming(false); }}
                >
                  <View style={[styles.camDot, { backgroundColor: cam.is_active ? colors.success : colors.textMuted }]} />
                  <Text style={[styles.camChipText, selectedCam?.id === cam.id && styles.camChipTextActive]} numberOfLines={1}>
                    {cam.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Camera info */}
            {selectedCam && (
              <View style={styles.camInfo}>
                <View style={styles.camInfoRow}>
                  <Ionicons name="location-outline" size={14} color={colors.textMuted} />
                  <Text style={styles.camInfoText}>{selectedCam.location_name}</Text>
                </View>
                {selectedCam.zone && (
                  <View style={styles.camInfoRow}>
                    <Ionicons name="map-outline" size={14} color={colors.textMuted} />
                    <Text style={styles.camInfoText}>Zone: {selectedCam.zone}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Stream view */}
            <View style={styles.streamContainer}>
              {streaming && streamUrl ? (
                <WebView
                  source={{ uri: streamUrl }}
                  style={styles.webview}
                  originWhitelist={['http://', 'https://']}
                  mixedContentMode="always"
                  onError={() => Alert.alert('Stream Error', 'Could not connect to camera stream.')}
                />
              ) : (
                <View style={styles.streamPlaceholder}>
                  <Ionicons name="videocam-off" size={56} color={colors.textMuted} />
                  <Text style={styles.streamPlaceholderText}>Stream not started</Text>
                  <Text style={styles.streamPlaceholderSub}>Tap "Start Stream" to view live feed</Text>
                </View>
              )}
            </View>

            {/* Controls */}
            <View style={styles.controls}>
              {streaming ? (
                <TouchableOpacity style={[styles.ctrlBtn, styles.stopBtn]} onPress={stopStream}>
                  <Ionicons name="stop-circle" size={20} color="#fff" />
                  <Text style={styles.ctrlBtnText}>Stop Stream</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={[styles.ctrlBtn, styles.startBtn]} onPress={startStream}>
                  <Ionicons name="play-circle" size={20} color="#fff" />
                  <Text style={styles.ctrlBtnText}>Start Stream</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[styles.ctrlBtn, styles.simBtn]} onPress={runSimulation}>
                <Ionicons name="scan" size={20} color="#fff" />
                <Text style={styles.ctrlBtnText}>Run Scan</Text>
              </TouchableOpacity>
            </View>

            {/* Live alert feed */}
            {lastAlert && (
              <View style={styles.liveAlertCard}>
                <View style={styles.liveAlertHeader}>
                  <Ionicons name="warning" size={16} color={colors.warning} />
                  <Text style={styles.liveAlertTitle}>Live Detection</Text>
                  <View style={styles.livePulse} />
                </View>
                <Text style={styles.liveAlertName}>{lastAlert.missing_person_name}</Text>
                <Text style={styles.liveAlertMeta}>
                  {lastAlert.camera_location} • {Math.round(lastAlert.confidence_score * 100)}% confidence
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
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
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  socketDot: { width: 8, height: 8, borderRadius: 4 },
  socketLabel: { fontSize: fonts.xs, color: colors.textSecondary },
  scroll: { flex: 1 },
  camSelector: { padding: spacing.md, paddingRight: 0 },
  camChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, marginRight: 8,
    borderRadius: radius.full, backgroundColor: colors.bgCard,
    borderWidth: 1, borderColor: colors.border,
  },
  camChipActive: { backgroundColor: colors.primaryDark, borderColor: colors.primary },
  camDot: { width: 6, height: 6, borderRadius: 3 },
  camChipText: { fontSize: fonts.sm, color: colors.textSecondary, fontWeight: '600', maxWidth: 120 },
  camChipTextActive: { color: '#fff' },
  camInfo: { paddingHorizontal: spacing.md, gap: 4, marginBottom: spacing.sm },
  camInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  camInfoText: { fontSize: fonts.sm, color: colors.textSecondary },
  streamContainer: {
    margin: spacing.md, borderRadius: radius.xl, overflow: 'hidden',
    height: 240, backgroundColor: colors.bgCard,
    borderWidth: 1, borderColor: colors.border,
  },
  webview: { flex: 1, backgroundColor: '#000' },
  streamPlaceholder: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  streamPlaceholderText: { fontSize: fonts.base, color: colors.textSecondary, fontWeight: '600' },
  streamPlaceholderSub: { fontSize: fonts.sm, color: colors.textMuted },
  controls: { flexDirection: 'row', gap: 12, paddingHorizontal: spacing.md, marginBottom: spacing.md },
  ctrlBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: 12, borderRadius: radius.md,
  },
  startBtn: { backgroundColor: colors.success },
  stopBtn: { backgroundColor: colors.danger },
  simBtn: { backgroundColor: colors.info },
  ctrlBtnText: { color: '#fff', fontWeight: '700', fontSize: fonts.sm },
  liveAlertCard: {
    margin: spacing.md, backgroundColor: colors.warningBg,
    borderRadius: radius.lg, padding: spacing.md,
    borderWidth: 1, borderColor: colors.warning + '44',
  },
  liveAlertHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  liveAlertTitle: { fontSize: fonts.sm, fontWeight: '700', color: colors.warning, flex: 1 },
  livePulse: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger,
  },
  liveAlertName: { fontSize: fonts.md, fontWeight: '800', color: colors.textPrimary },
  liveAlertMeta: { fontSize: fonts.sm, color: colors.textSecondary, marginTop: 2 },
  empty: { alignItems: 'center', padding: spacing.xl * 2, gap: 12 },
  emptyText: { fontSize: fonts.md, fontWeight: '600', color: colors.textSecondary },
  emptySubText: { fontSize: fonts.sm, color: colors.textMuted },
});
