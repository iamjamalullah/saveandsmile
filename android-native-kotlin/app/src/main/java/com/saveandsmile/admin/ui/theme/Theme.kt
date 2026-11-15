package com.saveandsmile.admin.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val SaveAndSmileDarkGreen = Color(0xFF0F3C28)
val SaveAndSmileEmerald = Color(0xFF037F62)
val SaveAndSmileMint = Color(0xFF34D399)
val SaveAndSmileLightGreen = Color(0xFFE6FDF4)
val BackgroundLight = Color(0xFFF8FAFC)
val SurfaceWhite = Color(0xFFFFFFFF)
val TextDark = Color(0xFF0F172A)
val TextMuted = Color(0xFF64748B)
val BorderLight = Color(0xFFE2E8F0)

val StatusPending = Color(0xFFFEF3C7)
val StatusPendingText = Color(0xFF78350F)
val StatusProcessing = Color(0xFFDBEAFE)
val StatusProcessingText = Color(0xFF1E40AF)
val StatusShipped = Color(0xFFEDE9FE)
val StatusShippedText = Color(0xFF5B21B6)
val StatusDelivered = Color(0xFFDCFCE7)
val StatusDeliveredText = Color(0xFF15803D)
val StatusCancelled = Color(0xFFFEE2E2)
val StatusCancelledText = Color(0xFFB91C1C)

private val LightColorScheme = lightColorScheme(
    primary = SaveAndSmileEmerald,
    onPrimary = Color.White,
    primaryContainer = SaveAndSmileLightGreen,
    onPrimaryContainer = SaveAndSmileDarkGreen,
    secondary = SaveAndSmileDarkGreen,
    onSecondary = Color.White,
    background = BackgroundLight,
    surface = SurfaceWhite,
    onSurface = TextDark,
    onBackground = TextDark
)

@Composable
fun SaveAndSmileTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = LightColorScheme,
        content = content
    )
}
