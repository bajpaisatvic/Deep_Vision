import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

import AdminDashboard from '../screens/admin/AdminDashboard';
import CameraManagementScreen from '../screens/admin/CameraManagementScreen';
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

export default function AdminNavigator() {
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
        tabBarActiveTintColor: colors.danger,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        tabBarIcon: ({ color, size }) => {
          const iconMap = {
            Dashboard: 'shield',
            Cases: 'folder-open',
            Alerts: 'warning',
            Cameras: 'camera',
            Notifs: 'notifications',
            Live: 'videocam',
          };
          return <Ionicons name={iconMap[route.name] || 'ellipse'} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={AdminDashboard} />
      <Tab.Screen name="Cases" component={CasesStack} />
      <Tab.Screen name="Alerts" component={AlertsStack} />
      <Tab.Screen name="Cameras" component={CameraManagementScreen} />
      <Tab.Screen name="Notifs" component={NotificationsScreen} />
      <Tab.Screen name="Live" component={LiveMonitoringScreen} />
    </Tab.Navigator>
  );
}
