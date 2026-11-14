import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext';
import { AdminDataProvider } from './src/context/AdminDataContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { notificationService } from './src/services/NotificationService';

export default function App() {
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  useEffect(() => {
    // 1. Setup notification navigation handler for deep linking
    notificationService.setNavigationHandler((screen, params) => {
      if (navigationRef.current?.isReady()) {
        navigationRef.current.navigate(screen, params);
      }
    });

    // 2. Register for push notifications & configure notification channels
    notificationService.registerForPushNotificationsAsync();

    // 3. Setup listeners for foreground & tap events
    const cleanupListeners = notificationService.setupNotificationListeners();

    return () => {
      cleanupListeners();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AdminDataProvider>
          <NavigationContainer ref={navigationRef}>
            <StatusBar style="dark" backgroundColor="#ffffff" />
            <AppNavigator />
          </NavigationContainer>
        </AdminDataProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
