package com.saveandsmile.admin.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.saveandsmile.admin.data.SessionManager
import com.saveandsmile.admin.model.Order
import com.saveandsmile.admin.model.Product
import com.saveandsmile.admin.network.ApiClient
import com.saveandsmile.admin.ui.theme.SaveAndSmileDarkGreen
import com.saveandsmile.admin.ui.theme.SaveAndSmileEmerald
import kotlinx.coroutines.launch

@Composable
fun DashboardScreen(
    onNavigateToOrders: () -> Unit,
    onNavigateToProducts: () -> Unit
) {
    val coroutineScope = rememberCoroutineScope()
    var orders by remember { mutableStateOf<List<Order>>(emptyList()) }
    var products by remember { mutableStateOf<List<Product>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }

    fun loadData() {
        coroutineScope.launch {
            isLoading = true
            try {
                val ordersRes = ApiClient.api.getOrders()
                if (ordersRes.isSuccessful) {
                    orders = ordersRes.body() ?: emptyList()
                }
                val productsRes = ApiClient.api.getProducts()
                if (productsRes.isSuccessful) {
                    products = productsRes.body() ?: emptyList()
                }
            } catch (_: Exception) {}
            isLoading = false
        }
    }

    LaunchedEffect(Unit) {
        loadData()
    }

    val totalRevenue = orders.filter { it.status == "delivered" }.sumOf { it.displayTotal }
    val pendingCount = orders.count { it.status == "pending" }
    val lowStockCount = products.count { it.stock <= 5 }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFF8FAFC))
            .padding(16.dp)
    ) {
        item {
            // Header
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Save & Smile Console",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = SaveAndSmileDarkGreen
                    )
                    Text(
                        text = "Logged in as: ${SessionManager.getUserName()}",
                        fontSize = 12.sp,
                        color = Color.Gray
                    )
                }
                IconButton(onClick = { loadData() }) {
                    Icon(Icons.Default.Refresh, contentDescription = "Refresh", tint = SaveAndSmileEmerald)
                }
            }

            if (isLoading) {
                LinearProgressIndicator(modifier = Modifier.fillMaxWidth(), color = SaveAndSmileEmerald)
                Spacer(modifier = Modifier.height(16.dp))
            }

            // Stat Cards Grid
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                StatCard(
                    title = "Delivered Revenue",
                    value = "Rs. ${String.format("%,.0f", totalRevenue)}",
                    icon = Icons.Default.Payments,
                    color = Color(0xFF037F62),
                    modifier = Modifier.weight(1f)
                )
                StatCard(
                    title = "Pending Orders",
                    value = "$pendingCount",
                    icon = Icons.Default.PendingActions,
                    color = Color(0xFFE8590C),
                    modifier = Modifier.weight(1f),
                    onClick = onNavigateToOrders
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                StatCard(
                    title = "Catalog Items",
                    value = "${products.size}",
                    icon = Icons.Default.Inventory2,
                    color = Color(0xFF2563EB),
                    modifier = Modifier.weight(1f),
                    onClick = onNavigateToProducts
                )
                StatCard(
                    title = "Low Stock Alert",
                    value = "$lowStockCount items",
                    icon = Icons.Default.WarningAmber,
                    color = Color(0xFFDC2626),
                    modifier = Modifier.weight(1f)
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Recent Orders Header
            Text(
                text = "Recent Orders",
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = SaveAndSmileDarkGreen,
                modifier = Modifier.padding(bottom = 8.dp)
            )
        }

        items(orders.take(5).size) { index ->
            val order = orders[index]
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp),
                shape = RoundedCornerShape(10.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(1.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(14.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(order.displayId, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        Text(order.customerName ?: "Customer", fontSize = 12.sp, color = Color.Gray)
                        Text("Rs. ${order.displayTotal.toInt()}", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = SaveAndSmileEmerald)
                    }
                    Badge(
                        containerColor = when (order.status) {
                            "delivered" -> Color(0xFFDCFCE7)
                            "pending" -> Color(0xFFFEF3C7)
                            "shipped" -> Color(0xFFEDE9FE)
                            else -> Color(0xFFDBEAFE)
                        }
                    ) {
                        Text(
                            text = order.status.uppercase(),
                            color = when (order.status) {
                                "delivered" -> Color(0xFF15803D)
                                "pending" -> Color(0xFF78350F)
                                "shipped" -> Color(0xFF5B21B6)
                                else -> Color(0xFF1E40AF)
                            },
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun StatCard(
    title: String,
    value: String,
    icon: ImageVector,
    color: Color,
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(2.dp),
        onClick = { onClick?.invoke() }
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Icon(icon, contentDescription = null, tint = color, modifier = Modifier.size(24.dp))
            Spacer(modifier = Modifier.height(8.dp))
            Text(value, fontSize = 18.sp, fontWeight = FontWeight.Bold, color = SaveAndSmileDarkGreen)
            Text(title, fontSize = 11.sp, color = Color.Gray)
        }
    }
}
