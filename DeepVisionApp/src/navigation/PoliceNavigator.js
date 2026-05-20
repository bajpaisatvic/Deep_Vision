import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

import PoliceDashboard from '../screens/police/PoliceDashboard';
import AllCasesScreen from '../screens/police/AllCasesScreen';
import AlertsListScreen from '../screens/police/AlertsListScreen';
import AlertDetailScreen from '../screens/police/AlertDetailScreen';
import NotificationsScreen from '../screens/police/NotificationsScreen';
import LiveMonitoringScreen from '../screens/police/LiveMonitoringScreen';
import CaseDetailScreen from '../screens/citizen/CaseDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function AlertsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AlertsList" component={AlertsListScreen} />
      <Stack.Screen name="AlertDetail" component={AlertDetailScreen} />
    </Stack.Navigator>
  );
}

function CasesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AllCasesList" component={AllCasesScreen} />
      <Stack.Screen name="CaseDetail" component={CaseDetailScreen} />
    </Stack.Navigator>
  );
}

function BadgeIcon({ name, color, size, badgeCount }) {
  return (
    <View>
      <Ionicons name={name} size={size} color={color} />
      {badgeCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badgeCount > 99 ? '99+' : badgeCount}</Text>
        </View>
      )}
    </View>
  );
}

export default function PoliceNavigator({ unreadCount = 0 }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bgCard,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: colors.primaryLight,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color, size }) => {
          const iconMap = {
            Dashboard: 'speedometer',
            Cases: 'folder-open',
            Alerts: 'warning',
            Notifications: 'notifications',
            Live: 'videocam',
          };
          if (route.name === 'Notifications') {
            return <BadgeIcon name="notifications" color={color} size={size} badgeCount={unreadCount} />;
          }
          return <Ionicons name={iconMap[route.name] || 'ellipse'} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={PoliceDashboard} />
      <Tab.Screen name="Cases" component={CasesStack} />
      <Tab.Screen name="Alerts" component={AlertsStack} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Live" component={LiveMonitoringScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: colors.danger,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
});
