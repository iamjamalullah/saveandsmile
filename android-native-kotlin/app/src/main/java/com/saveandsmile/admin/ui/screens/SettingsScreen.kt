package com.saveandsmile.admin.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ExitToApp
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Store
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.saveandsmile.admin.data.SessionManager
import com.saveandsmile.admin.ui.theme.SaveAndSmileDarkGreen

@Composable
fun SettingsScreen(onLogout: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFF8FAFC))
            .padding(16.dp)
    ) {
        Text("Store Administration", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = SaveAndSmileDarkGreen)

        Spacer(modifier = Modifier.height(16.dp))

        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(2.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row {
                    Icon(Icons.Default.Store, contentDescription = null, tint = SaveAndSmileDarkGreen)
                    Spacer(modifier = Modifier.width(10.dp))
                    Column {
                        Text("Save & Smile E-Commerce", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                        Text("Authoritative Console Connected", fontSize = 12.sp, color = Color.Gray)
                    }
                }

                Divider(modifier = Modifier.padding(vertical = 14.dp))

                Row {
                    Icon(Icons.Default.Security, contentDescription = null, tint = SaveAndSmileDarkGreen)
                    Spacer(modifier = Modifier.width(10.dp))
                    Column {
                        Text("Active Staff Session", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        Text("User: ${SessionManager.getUserName()} (${SessionManager.getUserRole().uppercase()})", fontSize = 12.sp, color = Color.DarkGray)
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        Button(
            onClick = onLogout,
            modifier = Modifier.fillMaxWidth().height(48.dp),
            shape = RoundedCornerShape(10.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFDC2626))
        ) {
            Icon(Icons.Default.ExitToApp, contentDescription = null)
            Spacer(modifier = Modifier.width(8.dp))
            Text("Sign Out Administrator", fontWeight = FontWeight.Bold)
        }
    }
}
