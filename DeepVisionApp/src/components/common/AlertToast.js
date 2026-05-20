import React, { useEffect, useRef, useState } from 'react';
import {
  Animated, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSocket } from '../../context/SocketContext';
import { colors, radius, spacing, fonts } from '../../theme';
import { confidenceColor } from '../../utils/helpers';

const TOAST_DURATION = 8000;

export default function AlertToast() {
  const { lastAlert } = useSocket();
  const [visible, setVisible] = useState(false);
  const slideY = useRef(new Animated.Value(-120)).current;
  const timerRef = useRef(null);

  useEffect(() => {
    if (!lastAlert) return;
    showToast();
  }, [lastAlert]);

  function showToast() {
    setVisible(true);
    Animated.spring(slideY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(hideToast, TOAST_DURATION);
  }

  function hideToast() {
    Animated.timing(slideY, {
      toValue: -120,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setVisible(false));
  }

  if (!visible || !lastAlert) return null;

  const conf = lastAlert.confidence_score;
  const confColor = confidenceColor(conf);

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideY }] }]}>
      <View style={styles.toast}>
        <View style={[styles.iconWrap, { backgroundColor: confColor + '33' }]}>
          <Ionicons name="warning" size={22} color={confColor} />
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>Missing Person Detected!</Text>
          <Text style={styles.name} numberOfLines={1}>{lastAlert.missing_person_name}</Text>
          <Text style={styles.meta} numberOfLines={1}>
            {lastAlert.camera_location} • {Math.round(conf * 100)}% confidence
          </Text>
        </View>
        <View style={[styles.confBadge, { backgroundColor: confColor }]}>
          <Text style={styles.confText}>{Math.round(conf * 100)}%</Text>
        </View>
        <TouchableOpacity onPress={hideToast} style={styles.closeBtn}>
          <Ionicons name="close" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    padding: spacing.sm,
    paddingTop: 50,
  },
  toast: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.warning + '66',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  iconWrap: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  content: { flex: 1 },
  title: { fontSize: fonts.xs, color: colors.warning, fontWeight: '700', letterSpacing: 0.5 },
  name: { fontSize: fonts.base, fontWeight: '800', color: colors.textPrimary, marginTop: 2 },
  meta: { fontSize: fonts.xs, color: colors.textSecondary, marginTop: 2 },
  confBadge: {
    borderRadius: radius.full,
    paddingHorizontal: 8, paddingVertical: 4,
    alignItems: 'center', justifyContent: 'center',
  },
  confText: { fontSize: fonts.xs, fontWeight: '800', color: '#fff' },
  closeBtn: { padding: 4 },
});
