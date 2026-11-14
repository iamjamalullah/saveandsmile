import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { BottomTabNavigator } from './BottomTabNavigator';
import { OrderDetailScreen } from '../screens/orders/OrderDetailScreen';
import { ProductEditScreen } from '../screens/products/ProductEditScreen';
import { HomePageEditorScreen } from '../screens/homepage/HomePageEditorScreen';
import { WatchShopScreen } from '../screens/watch-shop/WatchShopScreen';
import { ReviewsScreen } from '../screens/reviews/ReviewsScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { colors } from '../theme/colors';

const Stack = createNativeStackNavigator();

export const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.slate.background }}>
        <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
          <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
          <Stack.Screen name="ProductEdit" component={ProductEditScreen} />
          <Stack.Screen name="HomePageEditor" component={HomePageEditorScreen} />
          <Stack.Screen name="WatchShop" component={WatchShopScreen} />
          <Stack.Screen name="Reviews" component={ReviewsScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};
