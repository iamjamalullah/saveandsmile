package com.saveandsmile.admin.network

import com.saveandsmile.admin.model.*
import retrofit2.Response
import retrofit2.http.*

interface ApiService {

    // ── Authentication ──
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    @GET("auth/me")
    suspend fun getStaffProfile(): Response<Map<String, Any>>

    // ── Orders ──
    @GET("orders")
    suspend fun getOrders(): Response<List<Order>>

    @GET("orders/{id}")
    suspend fun getOrderById(@Path("id") id: String): Response<Order>

    @PATCH("orders/{id}")
    suspend fun updateOrderStatus(
        @Path("id") id: String,
        @Body update: OrderStatusUpdate
    ): Response<Order>

    @DELETE("orders/{id}")
    suspend fun deleteOrder(@Path("id") id: String): Response<Map<String, Any>>

    // ── Products ──
    @GET("products")
    suspend fun getProducts(): Response<List<Product>>

    @PATCH("products/{id}")
    suspend fun updateProductStock(
        @Path("id") id: Int,
        @Body update: ProductStockUpdate
    ): Response<Product>

    @POST("products")
    suspend fun createProduct(@Body product: Product): Response<Product>

    @DELETE("products/{id}")
    suspend fun deleteProduct(@Path("id") id: Int): Response<Map<String, Any>>

    // ── Inquiries & Reviews ──
    @GET("inquiries")
    suspend fun getInquiries(): Response<List<Inquiry>>

    @GET("reviews")
    suspend fun getReviews(): Response<List<Review>>

    @DELETE("reviews/{id}")
    suspend fun deleteReview(@Path("id") id: String): Response<Map<String, Any>>

    // ── FCM Push Notifications ──
    @POST("notifications/fcm-token")
    suspend fun registerFcmToken(@Body request: Map<String, String>): Response<Map<String, Any>>

    @HTTP(method = "DELETE", path = "notifications/fcm-token", hasBody = true)
    suspend fun removeFcmToken(@Body request: Map<String, String>): Response<Map<String, Any>>

    // ── System Health ──
    @GET("health")
    suspend fun getHealth(): Response<Map<String, Any>>
}
