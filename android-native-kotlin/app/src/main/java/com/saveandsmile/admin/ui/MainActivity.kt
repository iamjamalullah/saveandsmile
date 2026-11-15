package com.saveandsmile.admin.ui

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.navigation.compose.*
import com.saveandsmile.admin.data.SessionManager
import com.saveandsmile.admin.ui.screens.*
import com.saveandsmile.admin.ui.theme.SaveAndSmileTheme

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            SaveAndSmileTheme {
                MainAppNavigation()
            }
        }
    }
}

@Composable
fun MainAppNavigation() {
    val navController = rememberNavController()
    var isLoggedIn by remember { mutableStateOf(SessionManager.isLoggedIn()) }

    if (!isLoggedIn) {
        LoginScreen(
            onLoginSuccess = {
                isLoggedIn = true
                navController.navigate("dashboard") {
                    popUpTo("login") { inclusive = true }
                }
            }
        )
    } else {
        Scaffold(
            bottomBar = {
                val currentRoute = navController.currentBackStackEntryAsState().value?.destination?.route
                NavigationBar {
                    NavigationBarItem(
                        selected = currentRoute == "dashboard",
                        onClick = { navController.navigate("dashboard") { launchSingleTop = true } },
                        icon = { Icon(Icons.Default.Dashboard, contentDescription = "Dashboard") },
                        label = { Text("Overview") }
                    )
                    NavigationBarItem(
                        selected = currentRoute == "orders",
                        onClick = { navController.navigate("orders") { launchSingleTop = true } },
                        icon = { Icon(Icons.Default.ShoppingCart, contentDescription = "Orders") },
                        label = { Text("Orders") }
                    )
                    NavigationBarItem(
                        selected = currentRoute == "products",
                        onClick = { navController.navigate("products") { launchSingleTop = true } },
                        icon = { Icon(Icons.Default.Inventory, contentDescription = "Products") },
                        label = { Text("Products") }
                    )
                    NavigationBarItem(
                        selected = currentRoute == "inquiries",
                        onClick = { navController.navigate("inquiries") { launchSingleTop = true } },
                        icon = { Icon(Icons.Default.SupportAgent, contentDescription = "Support") },
                        label = { Text("Support") }
                    )
                    NavigationBarItem(
                        selected = currentRoute == "settings",
                        onClick = { navController.navigate("settings") { launchSingleTop = true } },
                        icon = { Icon(Icons.Default.Settings, contentDescription = "Settings") },
                        label = { Text("Settings") }
                    )
                }
            }
        ) { paddingValues ->
            NavHost(
                navController = navController,
                startDestination = "dashboard",
                modifier = Modifier.padding(paddingValues)
            ) {
                composable("dashboard") {
                    DashboardScreen(
                        onNavigateToOrders = { navController.navigate("orders") },
                        onNavigateToProducts = { navController.navigate("products") }
                    )
                }
                composable("orders") {
                    OrdersScreen()
                }
                composable("products") {
                    ProductsScreen()
                }
                composable("inquiries") {
                    InquiriesScreen()
                }
                composable("settings") {
                    SettingsScreen(
                        onLogout = {
                            SessionManager.logout()
                            isLoggedIn = false
                        }
                    )
                }
            }
        }
    }
}
