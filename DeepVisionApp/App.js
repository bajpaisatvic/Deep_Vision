import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { SocketProvider } from './src/context/SocketContext';
import AppNavigator from './src/navigation/AppNavigator';
import AlertToast from './src/components/common/AlertToast';
import { registerForPushNotifications } from './src/utils/notifications';
import { colors } from './src/theme';

function InnerApp() {
  return (
    <View style={styles.container}>
      <AppNavigator />
      <AlertToast />
    </View>
  );
}

export default function App() {
  useEffect(() => {
    registerForPushNotifications().catch(() => {});
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor={colors.bg} />
      <AuthProvider>
        <SocketProvider>
          <InnerApp />
        </SocketProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
});
