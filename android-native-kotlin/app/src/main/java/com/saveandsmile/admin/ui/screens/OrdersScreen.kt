package com.saveandsmile.admin.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.saveandsmile.admin.model.Order
import com.saveandsmile.admin.model.OrderStatusUpdate
import com.saveandsmile.admin.network.ApiClient
import com.saveandsmile.admin.ui.theme.SaveAndSmileDarkGreen
import com.saveandsmile.admin.ui.theme.SaveAndSmileEmerald
import kotlinx.coroutines.launch

@Composable
fun OrdersScreen() {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    var orders by remember { mutableStateOf<List<Order>>(emptyList()) }
    var selectedFilter by remember { mutableStateOf("all") }
    var isLoading by remember { mutableStateOf(true) }

    fun loadOrders() {
        coroutineScope.launch {
            isLoading = true
            try {
                val res = ApiClient.api.getOrders()
                if (res.isSuccessful) {
                    orders = res.body() ?: emptyList()
                }
            } catch (_: Exception) {}
            isLoading = false
        }
    }

    LaunchedEffect(Unit) {
        loadOrders()
    }

    val filteredOrders = if (selectedFilter == "all") {
        orders
    } else {
        orders.filter { it.status.equals(selectedFilter, ignoreCase = true) }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFF8FAFC))
            .padding(16.dp)
    ) {
        // Top Title
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Orders (${filteredOrders.size})", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = SaveAndSmileDarkGreen)
            IconButton(onClick = { loadOrders() }) {
                Icon(Icons.Default.Refresh, contentDescription = "Refresh", tint = SaveAndSmileEmerald)
            }
        }

        // Filter Tabs
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            listOf("all", "pending", "processing", "shipped", "delivered").forEach { status ->
                FilterChip(
                    selected = selectedFilter == status,
                    onClick = { selectedFilter = status },
                    label = { Text(status.replaceFirstChar { it.uppercase() }, fontSize = 11.sp) }
                )
            }
        }

        if (isLoading) {
            LinearProgressIndicator(modifier = Modifier.fillMaxWidth(), color = SaveAndSmileEmerald)
            Spacer(modifier = Modifier.height(12.dp))
        }

        LazyColumn(
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            items(filteredOrders.size) { index ->
                val order = filteredOrders[index]
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(2.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(order.displayId, fontWeight = FontWeight.Bold, fontSize = 15.sp, color = SaveAndSmileDarkGreen)
                            Text("Rs. ${order.displayTotal.toInt()}", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = SaveAndSmileEmerald)
                        }

                        Text("Customer: ${order.customerName ?: "Guest"}", fontSize = 13.sp, color = Color.DarkGray, modifier = Modifier.padding(top = 4.dp))
                        Text("Address: ${order.shippingAddress ?: "—"}, ${order.city ?: ""}", fontSize = 12.sp, color = Color.Gray)

                        Spacer(modifier = Modifier.height(10.dp))

                        // Actions Row (WhatsApp + Status Buttons)
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            // WhatsApp Contact Button
                            val phone = order.customerPhone?.replace(Regex("[^0-9]"), "") ?: ""
                            Button(
                                onClick = {
                                    if (phone.isNotBlank()) {
                                        val cleanPhone = if (phone.startsWith("0")) "92" + phone.substring(1) else phone
                                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://wa.me/$cleanPhone"))
                                        context.startActivity(intent)
                                    }
                                },
                                shape = RoundedCornerShape(8.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF25D366)),
                                contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp)
                            ) {
                                Icon(Icons.Default.Phone, contentDescription = null, modifier = Modifier.size(14.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("WhatsApp", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }

                            // Change Status Button
                            var showStatusMenu by remember { mutableStateOf(false) }
                            Box {
                                OutlinedButton(
                                    onClick = { showStatusMenu = true },
                                    shape = RoundedCornerShape(8.dp),
                                    contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp)
                                ) {
                                    Text("Status: ${order.status.uppercase()}", fontSize = 11.sp)
                                }
                                DropdownMenu(
                                    expanded = showStatusMenu,
                                    onDismissRequest = { showStatusMenu = false }
                                ) {
                                    listOf("pending", "processing", "shipped", "delivered", "cancelled").forEach { newStatus ->
                                        DropdownMenuItem(
                                            text = { Text(newStatus.uppercase()) },
                                            onClick = {
                                                showStatusMenu = false
                                                coroutineScope.launch {
                                                    try {
                                                        ApiClient.api.updateOrderStatus(order.id.toString(), OrderStatusUpdate(newStatus))
                                                        loadOrders()
                                                    } catch (_: Exception) {}
                                                }
                                            }
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
