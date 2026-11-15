package com.saveandsmile.admin.ui

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.core.content.ContextCompat
import androidx.navigation.NavController
import androidx.navigation.compose.*
import com.saveandsmile.admin.data.SessionManager
import com.saveandsmile.admin.network.ApiClient
import com.saveandsmile.admin.service.SaveAndSmileFirebaseMessagingService
import com.saveandsmile.admin.ui.screens.*
import com.saveandsmile.admin.ui.theme.SaveAndSmileTheme
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {

    private var initialTargetScreen: String? = null
    private var activeNavController: NavController? = null

    private val requestNotificationPermissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { isGranted: Boolean ->
            if (isGranted) {
                Log.d("MainActivity", "Notification permission granted.")
            } else {
                Log.w("MainActivity", "Notification permission denied by user.")
            }
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        SessionManager.init(applicationContext)

        // Initialize Android notification channels
        SaveAndSmileFirebaseMessagingService.createNotificationChannels(this)

        // Request POST_NOTIFICATIONS permission on Android 13+ (API 33+)
        checkAndRequestNotificationPermission()

        // Handle initial notification intent
        handleIntent(intent)

        setContent {
            SaveAndSmileTheme {
                MainAppNavigation(
                    initialScreen = initialTargetScreen,
                    onNavControllerReady = { activeNavController = it }
                )
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleIntent(intent)
        initialTargetScreen?.let { screen ->
            activeNavController?.navigate(screen) {
                launchSingleTop = true
            }
        }
    }

    private fun handleIntent(intent: Intent?) {
        intent?.extras?.let { bundle ->
            val target = bundle.getString("targetScreen")
            if (!target.isNullOrBlank()) {
                initialTargetScreen = target
                Log.d("MainActivity", "Incoming notification targetScreen: $target")
            }
        }
    }

    private fun checkAndRequestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val permissionStatus = ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.POST_NOTIFICATIONS
            )
            if (permissionStatus != PackageManager.PERMISSION_GRANTED) {
                Log.d("MainActivity", "Requesting POST_NOTIFICATIONS runtime permission...")
                requestNotificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }
    }
}

@Composable
fun MainAppNavigation(
    initialScreen: String? = null,
    onNavControllerReady: (NavController) -> Unit = {}
) {
    val navController = rememberNavController()
    LaunchedEffect(navController) {
        onNavControllerReady(navController)
    }

    var isLoggedIn by remember { mutableStateOf(SessionManager.isLoggedIn()) }
    val startDestination = if (isLoggedIn && !initialScreen.isNullOrBlank()) initialScreen else "dashboard"

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
                startDestination = startDestination,
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
                            // Unregister FCM token from backend asynchronously
                            CoroutineScope(Dispatchers.IO).launch {
                                try {
                                    val token = SessionManager.getFcmToken()
                                    if (!token.isNullOrBlank()) {
                                        ApiClient.apiService.removeFcmToken(mapOf("token" to token))
                                    }
                                } catch (e: Exception) {
                                    Log.w("MainActivity", "Failed to unregister FCM token during logout: ${e.message}")
                                }
                            }
                            SessionManager.logout()
                            isLoggedIn = false
                        }
                    )
                }
            }
        }
    }
}
