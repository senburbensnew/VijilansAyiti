import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors } from '../../constants/colors';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from '../../hooks/useTranslation';

function maskEmail(email: string) {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}${'*'.repeat(Math.max(local.length - 2, 2))}@${domain}`;
}

function maskPhone(phone: string) {
  if (phone.length <= 4) return phone;
  return `+509 ${'*'.repeat(phone.length - 4)}${phone.slice(-4)}`;
}

export default function VerifyOTP() {
  const C = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const T = useTranslation();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const [error, setError] = useState('');
  const inputs = useRef<TextInput[]>([]);
  const { isLoading, error: storeError, pendingPhone, pendingEmail, otpMethod, verifyOtp, sendOtp } =
    useAuthStore();

  const destination =
    otpMethod === 'email'
      ? maskEmail(pendingEmail)
      : maskPhone(pendingPhone || '+50900000000');

  const channelLabel = otpMethod === 'email' ? 'e-mail' : 'SMS';
  const channelIcon =
    otpMethod === 'email' ? 'mail-outline' : 'phone-portrait-outline';

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleChange = (text: string, idx: number) => {
    const digit = text.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[idx] = digit;
    setOtp(next);
    setError('');
    if (digit && idx < 5) inputs.current[idx + 1]?.focus();
    if (!digit && idx > 0) inputs.current[idx - 1]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) return;
    setError('');
    await verifyOtp(code);
    const { error: authError, isAuthenticated } = useAuthStore.getState();
    if (authError) {
      setError(authError);
    } else if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  };

  const handleResend = async () => {
    setCountdown(60);
    setOtp(['', '', '', '', '', '']);
    setError('');
    inputs.current[0]?.focus();
    await sendOtp();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={22} color={C.text} />
      </TouchableOpacity>

      {/* Channel icon */}
      <View style={styles.iconWrap}>
        <Ionicons name={channelIcon as any} size={48} color={C.primary} />
      </View>

      <Text style={styles.title}>{T('otpTitle')}</Text>

      {/* Destination info */}
      <View style={styles.destinationBox}>
        <Ionicons
          name={otpMethod === 'email' ? 'mail' : 'chatbubble'}
          size={14}
          color={C.primary}
        />
        <Text style={styles.destinationText}>
          {T('otpSentTo')} {channelLabel} {T('otpTo')}{' '}
          <Text style={styles.destinationValue}>{destination}</Text>
        </Text>
      </View>

      <Text style={styles.hint}>
        {T('otpHint')} {channelLabel}
      </Text>

      {/* OTP inputs */}
      <View style={styles.otpRow}>
        {otp.map((digit, idx) => (
          <TextInput
            key={idx}
            ref={(r) => { if (r) inputs.current[idx] = r; }}
            style={[styles.otpInput, digit ? styles.otpInputFilled : undefined]}
            value={digit}
            onChangeText={(t) => handleChange(t, idx)}
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
          />
        ))}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {/* Verify button */}
      <TouchableOpacity
        style={[styles.btn, otp.join('').length < 6 && styles.btnDisabled]}
        onPress={handleVerify}
        disabled={otp.join('').length < 6 || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>{T('otpVerify')}</Text>
        )}
      </TouchableOpacity>

      {/* Resend */}
      <TouchableOpacity
        style={styles.resend}
        disabled={countdown > 0}
        onPress={handleResend}
      >
        {countdown > 0 ? (
          <Text style={styles.resendDisabled}>
            {T('otpResendIn')}{' '}
            <Text style={styles.resendCountdown}>{countdown}s</Text>
          </Text>
        ) : (
          <Text style={styles.resendActive}>
            {T('otpResend')} {channelLabel}
          </Text>
        )}
      </TouchableOpacity>

      {/* Switch method hint */}
      <TouchableOpacity style={styles.switchMethod} onPress={() => router.back()}>
        <Ionicons
          name={otpMethod === 'email' ? 'phone-portrait-outline' : 'mail-outline'}
          size={14}
          color={C.textMuted}
        />
        <Text style={styles.switchMethodText}>
          {T('otpSwitchVia')} {otpMethod === 'email' ? 'SMS' : 'e-mail'} {T('otpSwitchInstead')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.black, padding: 24, alignItems: 'center', justifyContent: 'center' },
    back: { position: 'absolute', top: 56, left: 24 },
    iconWrap: { marginBottom: 20 },
    title: { fontSize: 24, fontWeight: '700', color: C.text, marginBottom: 12 },
    destinationBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: `${C.primary}18`, borderWidth: 1, borderColor: `${C.primary}44`, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9, marginBottom: 8 },
    destinationText: { color: C.textSecondary, fontSize: 13 },
    destinationValue: { color: C.text, fontWeight: '700' },
    hint: { color: C.textMuted, fontSize: 11, textAlign: 'center', marginBottom: 28 },
    otpRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    otpInput: { width: 46, height: 56, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 10, textAlign: 'center', fontSize: 22, fontWeight: '700', color: C.text },
    otpInputFilled: { borderColor: C.primary, backgroundColor: `${C.primary}22` },
    error: { color: C.danger, fontSize: 13, marginBottom: 12 },
    btn: { backgroundColor: C.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', width: '100%' },
    btnDisabled: { opacity: 0.4 },
    btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    resend: { marginTop: 20, paddingVertical: 10 },
    resendDisabled: { color: C.textMuted, fontSize: 13 },
    resendCountdown: { color: C.warning, fontWeight: '700' },
    resendActive: { color: C.primary, fontSize: 13, textDecorationLine: 'underline' },
    switchMethod: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingVertical: 8 },
    switchMethodText: { color: C.textMuted, fontSize: 12 },
  });
}
