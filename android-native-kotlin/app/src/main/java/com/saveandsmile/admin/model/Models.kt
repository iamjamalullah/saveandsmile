package com.saveandsmile.admin.model

import com.google.gson.annotations.SerializedName

// ── Authentication ──
data class LoginRequest(
    val email: String? = null,
    val username: String? = null,
    val password: String
)

data class LoginResponse(
    val token: String,
    val user: StaffUser,
    val expiresIn: Long? = null
)

data class StaffUser(
    val id: Int,
    val name: String,
    val email: String,
    val role: String
)

// ── Orders ──
data class Order(
    val id: Any, // can be Int or String
    val orderNumber: String? = null,
    val customerName: String? = null,
    val customerPhone: String? = null,
    val shippingAddress: String? = null,
    val city: String? = null,
    val totalAmount: Double = 0.0,
    val total: Double? = null,
    val status: String = "pending",
    val paymentMethod: String = "COD",
    val items: List<OrderItem> = emptyList(),
    val createdAt: String? = null
) {
    val displayTotal: Double get() = if (totalAmount > 0) totalAmount else (total ?: 0.0)
    val displayId: String get() = orderNumber ?: "GS-$id"
}

data class OrderItem(
    val id: Any? = null,
    val productId: Any? = null,
    val name: String? = null,
    val price: Double = 0.0,
    val qty: Int = 1,
    val image: String? = null
)

data class OrderStatusUpdate(
    val status: String
)

// ── Products ──
data class Product(
    val id: Int,
    val name: String,
    val sku: String? = null,
    val category: String = "General",
    val price: Double = 0.0,
    val oldPrice: Double = 0.0,
    val stock: Int = 0,
    val image: String? = null,
    val description: String? = null,
    val hasVariants: Boolean = false,
    val variants: List<ProductVariant>? = null
)

data class ProductVariant(
    val id: Any? = null,
    val color: String? = null,
    val size: String? = null,
    val sku: String? = null,
    val stock: Int = 0,
    val price: Double? = null
)

data class ProductStockUpdate(
    val stock: Int
)

// ── Dashboard Metrics ──
data class DashboardKPIs(
    val todayRevenue: Double = 0.0,
    val totalRevenue: Double = 0.0,
    val pendingOrdersCount: Int = 0,
    val shippedOrdersCount: Int = 0,
    val deliveredOrdersCount: Int = 0,
    val lowStockCount: Int = 0,
    val totalProductsCount: Int = 0
)

// ── Inquiries ──
data class Inquiry(
    val id: Any,
    val name: String,
    val phone: String,
    val message: String? = null,
    val type: String? = "General Inquiry",
    val status: String = "pending",
    val createdAt: String? = null
)

// ── Reviews ──
data class Review(
    val id: Any,
    val productName: String? = null,
    val customerName: String? = null,
    val rating: Int = 5,
    val comment: String? = null,
    val isVerified: Boolean = false,
    val status: String = "approved",
    val createdAt: String? = null
)
