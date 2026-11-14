import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { AuthProvider } from './src/context/AuthContext';
import { AdminDataProvider } from './src/context/AdminDataContext';
import { AppNavigator } from './src/navigation/AppNavigator';

// Configure push notifications display behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  useEffect(() => {
    // Request notification permissions gracefully on launch
    const requestNotificationPermission = async () => {
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
      } catch {}
    };

    requestNotificationPermission();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AdminDataProvider>
          <NavigationContainer>
            <StatusBar style="dark" backgroundColor="#ffffff" />
            <AppNavigator />
          </NavigationContainer>
        </AdminDataProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
