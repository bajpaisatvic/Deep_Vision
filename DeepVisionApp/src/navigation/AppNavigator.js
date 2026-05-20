import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';
import { ROLES } from '../config';
import AuthNavigator from './AuthNavigator';
import CitizenNavigator from './CitizenNavigator';
import PoliceNavigator from './PoliceNavigator';
import AdminNavigator from './AdminNavigator';

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!user && <AuthNavigator />}
      {user?.role === ROLES.CITIZEN && <CitizenNavigator />}
      {user?.role === ROLES.POLICE && <PoliceNavigator />}
      {user?.role === ROLES.ADMIN && <AdminNavigator />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
