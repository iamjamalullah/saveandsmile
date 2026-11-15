package com.saveandsmile.admin.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Chat
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
import com.saveandsmile.admin.model.Inquiry
import com.saveandsmile.admin.network.ApiClient
import com.saveandsmile.admin.ui.theme.SaveAndSmileDarkGreen
import com.saveandsmile.admin.ui.theme.SaveAndSmileEmerald
import kotlinx.coroutines.launch

@Composable
fun InquiriesScreen() {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    var inquiries by remember { mutableStateOf<List<Inquiry>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }

    fun loadInquiries() {
        coroutineScope.launch {
            isLoading = true
            try {
                val res = ApiClient.api.getInquiries()
                if (res.isSuccessful) {
                    inquiries = res.body() ?: emptyList()
                }
            } catch (_: Exception) {}
            isLoading = false
        }
    }

    LaunchedEffect(Unit) {
        loadInquiries()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFF8FAFC))
            .padding(16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Customer Support (${inquiries.size})", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = SaveAndSmileDarkGreen)
            IconButton(onClick = { loadInquiries() }) {
                Icon(Icons.Default.Refresh, contentDescription = "Refresh", tint = SaveAndSmileEmerald)
            }
        }

        if (isLoading) {
            LinearProgressIndicator(modifier = Modifier.fillMaxWidth(), color = SaveAndSmileEmerald)
            Spacer(modifier = Modifier.height(10.dp))
        }

        LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            items(inquiries.size) { index ->
                val inq = inquiries[index]
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(2.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(inq.name, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            Text(inq.type ?: "General", fontSize = 11.sp, color = SaveAndSmileEmerald, fontWeight = FontWeight.SemiBold)
                        }

                        Text("Phone: ${inq.phone}", fontSize = 12.sp, color = Color.Gray, modifier = Modifier.padding(vertical = 2.dp))
                        Text(inq.message ?: "No message text provided", fontSize = 13.sp, color = Color.DarkGray, modifier = Modifier.padding(vertical = 4.dp))

                        Spacer(modifier = Modifier.height(8.dp))

                        // WhatsApp Action
                        val phone = inq.phone.replace(Regex("[^0-9]"), "")
                        Button(
                            onClick = {
                                val clean = if (phone.startsWith("0")) "92" + phone.substring(1) else phone
                                val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://wa.me/$clean?text=Hello%20${inq.name},%20regarding%20your%20inquiry%20at%20Save%20%26%20Smile:"))
                                context.startActivity(intent)
                            },
                            shape = RoundedCornerShape(8.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF25D366))
                        ) {
                            Icon(Icons.Default.Chat, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Reply via WhatsApp", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}
