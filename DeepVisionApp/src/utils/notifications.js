import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications() {
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('alerts', {
      name: 'Missing Person Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1a56db',
      sound: true,
    });

    await Notifications.setNotificationChannelAsync('notifications', {
      name: 'General Notifications',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  return true;
}

export async function showLocalAlert(alert) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `🚨 Missing Person Detected!`,
      body: `${alert.missing_person_name} spotted at ${alert.camera_location} — ${Math.round(alert.confidence_score * 100)}% confidence`,
      data: { alertId: alert.alert_id, type: 'detection_alert' },
      sound: true,
    },
    trigger: null, // immediate
    ...(Platform.OS === 'android' && { channelId: 'alerts' }),
  });
}

export async function showLocalNotification(title, body, data = {}) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data, sound: true },
    trigger: null,
    ...(Platform.OS === 'android' && { channelId: 'notifications' }),
  });
}
