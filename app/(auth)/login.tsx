import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors } from '../../constants/colors';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore, OtpMethod } from '../../store/authStore';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const [method, setMethod] = useState<OtpMethod>('sms');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const C = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const {
    isLoading,
    error,
    setPendingPhone,
    setPendingEmail,
    setOtpMethod,
    sendOtp,
  } = useAuthStore();

  const phoneValid = phone.length >= 8;
  const emailValid = EMAIL_RE.test(email);
  const canSubmit = method === 'sms' ? phoneValid : emailValid;

  const handleSendOTP = async () => {
    if (!canSubmit) return;
    setOtpMethod(method);
    if (method === 'sms') {
      setPendingPhone(`+509${phone}`);
    } else {
      setPendingEmail(email);
    }
    await sendOtp();
    if (!useAuthStore.getState().error) {
      router.push('/(auth)/verify-otp');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand */}
        <View style={styles.brand}>
          <View style={styles.logoCircle}>
            <Ionicons name="shield" size={48} color={C.danger} />
          </View>
          <Text style={styles.title}>VijilansAyiti</Text>
          <Text style={styles.subtitle}>Protejons kominote nou ansanm</Text>
          <Text style={styles.subtitleFr}>Protégeons notre communauté ensemble</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Method tabs */}
          <View style={styles.methodTabs}>
            <MethodTab
              active={method === 'sms'}
              icon="phone-portrait-outline"
              label="SMS"
              onPress={() => setMethod('sms')}
            />
            <MethodTab
              active={method === 'email'}
              icon="mail-outline"
              label="Email"
              onPress={() => setMethod('email')}
            />
          </View>

          {method === 'sms' ? (
            <>
              <Text style={styles.label}>Numéro de téléphone</Text>
              <View style={styles.inputRow}>
                <View style={styles.prefix}>
                  <Text style={styles.prefixText}>🇭🇹 +509</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="XX XX XXXX"
                  placeholderTextColor={C.textMuted}
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                  maxLength={8}
                />
              </View>
              <Text style={styles.hint}>
                Un code à 6 chiffres vous sera envoyé par SMS
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.label}>Adresse e-mail</Text>
              <TextInput
                style={[styles.input, styles.inputFull]}
                placeholder="exemple@gmail.com"
                placeholderTextColor={C.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
              />
              <Text style={styles.hint}>
                Un code à 6 chiffres vous sera envoyé par e-mail
              </Text>
            </>
          )}

          <TouchableOpacity
            style={[styles.btn, !canSubmit && styles.btnDisabled]}
            onPress={handleSendOTP}
            disabled={!canSubmit || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons
                  name={method === 'sms' ? 'chatbubble-outline' : 'mail-outline'}
                  size={18}
                  color="#fff"
                />
                <Text style={styles.btnText}>Recevoir le code OTP</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </>
            )}
          </TouchableOpacity>

          {error ? (
            <Text style={{ color: C.danger, fontSize: 13, textAlign: 'center' }}>
              {error}
            </Text>
          ) : null}

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.anonBtn}
            onPress={() => router.push('/report/new')}
          >
            <Ionicons name="eye-off-outline" size={16} color={C.textMuted} />
            <Text style={styles.anonText}>
              Signaler anonymement (limité à 1 signalement)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Security note */}
        <View style={styles.securityNote}>
          <Ionicons name="lock-closed-outline" size={14} color={C.textMuted} />
          <Text style={styles.securityText}>
            {method === 'sms'
              ? 'Votre numéro est chiffré. Les bandits évitent de laisser des traces.'
              : 'Votre adresse e-mail est chiffrée et ne sera jamais partagée.'}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function MethodTab({
  active, icon, label, onPress,
}: {
  active: boolean; icon: string; label: string; onPress: () => void;
}) {
  const C = useTheme();
  const s = useMemo(() => makeStyles(C), [C]);
  return (
    <TouchableOpacity style={[s.tab, active && s.tabActive]} onPress={onPress}>
      <Ionicons name={icon as any} size={18} color={active ? C.danger : C.textMuted} />
      <Text style={[s.tabText, active && s.tabTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    container: { flexGrow: 1, backgroundColor: C.black, padding: 24, justifyContent: 'center' },
    brand: { alignItems: 'center', marginBottom: 40 },
    logoCircle: {
      width: 96, height: 96, borderRadius: 48,
      backgroundColor: C.dark, alignItems: 'center', justifyContent: 'center',
      borderWidth: 2, borderColor: C.danger, marginBottom: 16,
    },
    title: { fontSize: 28, fontWeight: '800', color: C.text, letterSpacing: 1 },
    subtitle: { color: C.textMuted, fontSize: 13, marginTop: 4 },
    subtitleFr: { color: C.textMuted, fontSize: 12, fontStyle: 'italic', marginTop: 2 },
    form: { gap: 12 },
    methodTabs: {
      flexDirection: 'row', backgroundColor: C.surface,
      borderRadius: 12, borderWidth: 1, borderColor: C.border,
      padding: 4, gap: 4, marginBottom: 4,
    },
    tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 9 },
    tabActive: { backgroundColor: C.dark, borderWidth: 1, borderColor: `${C.danger}66` },
    tabText: { color: C.textMuted, fontSize: 14, fontWeight: '600' },
    tabTextActive: { color: C.danger },
    label: { color: C.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 4 },
    inputRow: { flexDirection: 'row', gap: 8 },
    prefix: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 12, justifyContent: 'center' },
    prefixText: { color: C.text, fontSize: 14, fontWeight: '600' },
    input: { flex: 1, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: C.text, fontSize: 16, letterSpacing: 2 },
    inputFull: { letterSpacing: 0 },
    hint: { color: C.textMuted, fontSize: 11, marginTop: -4 },
    btn: { backgroundColor: C.danger, borderRadius: 12, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 8 },
    btnDisabled: { opacity: 0.4 },
    btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 4 },
    dividerLine: { flex: 1, height: 1, backgroundColor: C.border },
    dividerText: { color: C.textMuted, fontSize: 12 },
    anonBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderWidth: 1, borderColor: C.border, borderRadius: 12 },
    anonText: { color: C.textMuted, fontSize: 13 },
    demoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10 },
    demoText: { color: C.primary, fontSize: 13, fontWeight: '500', textDecorationLine: 'underline' },
    securityNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 32, padding: 12, backgroundColor: C.dark, borderRadius: 8, borderWidth: 1, borderColor: C.border },
    securityText: { color: C.textMuted, fontSize: 11, flex: 1, lineHeight: 16 },
  });
}
