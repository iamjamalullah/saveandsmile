package com.saveandsmile.admin.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.saveandsmile.admin.model.Product
import com.saveandsmile.admin.model.ProductStockUpdate
import com.saveandsmile.admin.network.ApiClient
import com.saveandsmile.admin.ui.theme.SaveAndSmileDarkGreen
import com.saveandsmile.admin.ui.theme.SaveAndSmileEmerald
import kotlinx.coroutines.launch

@Composable
fun ProductsScreen() {
    val coroutineScope = rememberCoroutineScope()
    var products by remember { mutableStateOf<List<Product>>(emptyList()) }
    var searchQuery by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(true) }

    fun loadProducts() {
        coroutineScope.launch {
            isLoading = true
            try {
                val res = ApiClient.api.getProducts()
                if (res.isSuccessful) {
                    products = res.body() ?: emptyList()
                }
            } catch (_: Exception) {}
            isLoading = false
        }
    }

    LaunchedEffect(Unit) {
        loadProducts()
    }

    val filteredProducts = products.filter {
        it.name.contains(searchQuery, ignoreCase = true) ||
        (it.sku ?: "").contains(searchQuery, ignoreCase = true) ||
        it.category.contains(searchQuery, ignoreCase = true)
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFF8FAFC))
            .padding(16.dp)
    ) {
        // Top Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Inventory (${filteredProducts.size})", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = SaveAndSmileDarkGreen)
            IconButton(onClick = { loadProducts() }) {
                Icon(Icons.Default.Refresh, contentDescription = "Refresh", tint = SaveAndSmileEmerald)
            }
        }

        // Search Bar
        OutlinedTextField(
            value = searchQuery,
            onValueChange = { searchQuery = it },
            placeholder = { Text("Search by title, SKU, category...") },
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 8.dp),
            shape = RoundedCornerShape(10.dp)
        )

        if (isLoading) {
            LinearProgressIndicator(modifier = Modifier.fillMaxWidth(), color = SaveAndSmileEmerald)
            Spacer(modifier = Modifier.height(10.dp))
        }

        LazyColumn(
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            items(filteredProducts.size) { index ->
                val p = filteredProducts[index]
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(2.dp)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Thumbnail Image
                        AsyncImage(
                            model = p.image ?: "https://saveandsmile.vercel.app/images/cat1.jpg",
                            contentDescription = p.name,
                            modifier = Modifier
                                .size(50.dp)
                                .background(Color(0xFFF1F5F9), RoundedCornerShape(8.dp)),
                            contentScale = ContentScale.Crop
                        )

                        Spacer(modifier = Modifier.width(14.dp))

                        // Product Info
                        Column(modifier = Modifier.weight(1f)) {
                            Text(p.name, fontWeight = FontWeight.Bold, fontSize = 13.sp, maxLines = 2)
                            Text("Category: ${p.category} | SKU: ${p.sku ?: "GS-${p.id}"}", fontSize = 11.sp, color = Color.Gray)
                            Text("Rs. ${p.price.toInt()}", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = SaveAndSmileEmerald)
                        }

                        // Stock Toggle Switch
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Switch(
                                checked = p.stock > 0,
                                onCheckedChange = { isChecked ->
                                    val newStock = if (isChecked) 15 else 0
                                    coroutineScope.launch {
                                        try {
                                            ApiClient.api.updateProductStock(p.id, ProductStockUpdate(newStock))
                                            loadProducts()
                                        } catch (_: Exception) {}
                                    }
                                }
                            )
                            Text(
                                text = if (p.stock > 0) "${p.stock} in stock" else "Out of stock",
                                fontSize = 10.sp,
                                color = if (p.stock > 0) Color(0xFF15803D) else Color(0xFFB91C1C)
                            )
                        }
                    }
                }
            }
        }
    }
}
