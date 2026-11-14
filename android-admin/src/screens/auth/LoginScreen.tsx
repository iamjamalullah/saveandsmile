import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { Lock, Mail, ShieldCheck, Eye, EyeOff } from 'lucide-react-native';

export const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!identifier.trim() || !password.trim()) {
      Alert.alert('Required Fields', 'Please enter your administrator email/username and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(identifier.trim(), password.trim());
    } catch (err: any) {
      Alert.alert(
        'Login Failed',
        err?.message || 'Invalid administrator credentials. Please check your username and password.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Brand Logo & Header */}
        <View style={styles.brandContainer}>
          <View style={styles.brandMark}>
            <Text style={styles.brandLetter}>S</Text>
          </View>
          <Text style={styles.brandTitle}>Save & Smile</Text>
          <Text style={styles.brandSubtitle}>Admin Console for Android</Text>
        </View>

        {/* Login Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <ShieldCheck size={16} color={colors.primary.DEFAULT} />
            <Text style={styles.cardTitle}>Administrator Access</Text>
          </View>

          {/* Identifier Input */}
          <Text style={styles.inputLabel}>Staff Username or Email</Text>
          <View style={styles.inputWrapper}>
            <Mail size={16} color={colors.slate.muted} />
            <TextInput
              style={styles.textInput}
              placeholder="e.g. admin or admin@saveandsmile.com"
              placeholderTextColor={colors.slate.muted}
              autoCapitalize="none"
              value={identifier}
              onChangeText={setIdentifier}
            />
          </View>

          {/* Password Input */}
          <Text style={styles.inputLabel}>Security Password</Text>
          <View style={styles.inputWrapper}>
            <Lock size={16} color={colors.slate.muted} />
            <TextInput
              style={styles.textInput}
              placeholder="Enter password"
              placeholderTextColor={colors.slate.muted}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(p => !p)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              {showPassword ? (
                <EyeOff size={16} color={colors.slate.muted} />
              ) : (
                <Eye size={16} color={colors.slate.muted} />
              )}
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={isSubmitting}
            style={[styles.loginBtn, isSubmitting && styles.loginBtnDisabled]}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={styles.loginBtnText}>Secure Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Server Indicator */}
        <View style={styles.serverInfo}>
          <View style={styles.onlineDot} />
          <Text style={styles.serverText}>Production: saveandsmile.vercel.app</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary.dark,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  brandMark: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.primary.DEFAULT,
    borderWidth: 2,
    borderColor: '#34d399',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    ...spacing.shadow.md,
  },
  brandLetter: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.white,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 12,
    color: '#a7f3d0',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: spacing.borderRadius.xl,
    padding: spacing.xl,
    ...spacing.shadow.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate.divider,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.slate.ink,
  },
  inputLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.slate.body,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.slate.background,
    borderWidth: 1,
    borderColor: colors.slate.border,
    borderRadius: spacing.borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 44,
    marginBottom: spacing.md,
    gap: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    color: colors.slate.ink,
  },
  loginBtn: {
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: spacing.borderRadius.md,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    ...spacing.shadow.sm,
  },
  loginBtnDisabled: {
    opacity: 0.65,
  },
  loginBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.3,
  },
  serverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
    gap: 6,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34d399',
  },
  serverText: {
    fontSize: 11,
    color: '#a7f3d0',
    fontFamily: 'monospace',
  },
});
