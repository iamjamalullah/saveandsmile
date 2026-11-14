import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { OrdersListScreen } from '../screens/orders/OrdersListScreen';
import { ProductsListScreen } from '../screens/products/ProductsListScreen';
import { CategoriesListScreen } from '../screens/categories/CategoriesListScreen';
import { MoreMenuScreen } from '../screens/more/MoreMenuScreen';
import { useAdminData } from '../context/AdminDataContext';
import { colors } from '../theme/colors';
import {
  LayoutDashboard,
  Receipt,
  Package,
  Tags,
  Menu,
} from 'lucide-react-native';

const Tab = createBottomTabNavigator();

export const BottomTabNavigator: React.FC = () => {
  const { stats } = useAdminData();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary.DEFAULT,
        tabBarInactiveTintColor: colors.slate.muted,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.slate.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={20} color={color} />,
        }}
      />

      <Tab.Screen
        name="OrdersTab"
        component={OrdersListScreen}
        options={{
          tabBarLabel: 'Orders',
          tabBarBadge: stats.pendingOrders > 0 ? stats.pendingOrders : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.accent.DEFAULT,
            fontSize: 9,
            fontWeight: '700',
          },
          tabBarIcon: ({ color, size }) => <Receipt size={20} color={color} />,
        }}
      />

      <Tab.Screen
        name="ProductsTab"
        component={ProductsListScreen}
        options={{
          tabBarLabel: 'Products',
          tabBarBadge: stats.lowStockProducts > 0 ? stats.lowStockProducts : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.danger.DEFAULT,
            fontSize: 9,
            fontWeight: '700',
          },
          tabBarIcon: ({ color, size }) => <Package size={20} color={color} />,
        }}
      />

      <Tab.Screen
        name="CategoriesTab"
        component={CategoriesListScreen}
        options={{
          tabBarLabel: 'Categories',
          tabBarIcon: ({ color, size }) => <Tags size={20} color={color} />,
        }}
      />

      <Tab.Screen
        name="MoreTab"
        component={MoreMenuScreen}
        options={{
          tabBarLabel: 'More',
          tabBarIcon: ({ color, size }) => <Menu size={20} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};
