import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

import CitizenDashboard from '../screens/citizen/CitizenDashboard';
import ReportMissingScreen from '../screens/citizen/ReportMissingScreen';
import MyCasesScreen from '../screens/citizen/MyCasesScreen';
import CaseDetailScreen from '../screens/citizen/CaseDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function CasesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MyCasesList" component={MyCasesScreen} />
      <Stack.Screen name="CaseDetail" component={CaseDetailScreen} />
    </Stack.Navigator>
  );
}

export default function CitizenNavigator() {
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
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Home: 'home',
            Report: 'add-circle',
            'My Cases': 'folder-open',
          };
          return <Ionicons name={icons[route.name] || 'ellipse'} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={CitizenDashboard} />
      <Tab.Screen name="Report" component={ReportMissingScreen} />
      <Tab.Screen name="My Cases" component={CasesStack} />
    </Tab.Navigator>
  );
}
