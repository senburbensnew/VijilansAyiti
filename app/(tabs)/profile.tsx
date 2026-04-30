import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors } from '../../constants/colors';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { useTheme } from '../../hooks/useTheme';
import { useThemeStore, ThemeMode } from '../../store/themeStore';
import TrustBadge from '../../components/TrustBadge';
import CityZonePicker from '../../components/CityZonePicker';

const THEME_OPTIONS: { key: ThemeMode; label: string; icon: string }[] = [
  { key: 'light', label: 'Clair', icon: 'sunny-outline' },
  { key: 'dark', label: 'Sombre', icon: 'moon-outline' },
  { key: 'system', label: 'Système', icon: 'phone-portrait-outline' },
];

export default function ProfileTab() {
  const { user, logout, updatePseudo, isLoading } = useAuthStore();
  const {
    enabled,
    permissionGranted,
    criticalOnly,
    watchedCity,
    setEnabled,
    setCriticalOnly,
    setWatchedCity,
  } = useNotificationStore();
  const C = useTheme();
  const { mode, setMode } = useThemeStore();
  const styles = useMemo(() => makeStyles(C), [C]);
  const [cityPickerVisible, setCityPickerVisible] = useState(false);
  const [editingPseudo, setEditingPseudo] = useState(false);
  const [pseudoInput, setPseudoInput] = useState('');

  if (!user) {
    return (
      <View style={styles.notAuth}>
        <Ionicons name="person-circle-outline" size={64} color={C.textMuted} />
        <Text style={styles.notAuthText}>Vous n'êtes pas connecté</Text>
        <TouchableOpacity
          style={styles.loginBtn}
          onPress={() => router.replace('/(auth)/login')}
        >
          <Text style={styles.loginBtnText}>Se connecter</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const accuracy =
    user.reportCount > 0
      ? Math.round((user.validatedReports / user.reportCount) * 100)
      : 0;

  const handleEditPseudo = () => {
    setPseudoInput(user.pseudo);
    setEditingPseudo(true);
  };

  const handleSavePseudo = async () => {
    const trimmed = pseudoInput.trim();
    if (!trimmed || trimmed.length < 3) return;
    await updatePseudo(trimmed);
    setEditingPseudo(false);
  };

  const handleCancelPseudo = () => {
    setEditingPseudo(false);
    setPseudoInput('');
  };

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnecter',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Avatar / Header */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user.pseudo.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.avatarInfo}>
          {editingPseudo ? (
            <View style={styles.pseudoEditRow}>
              <TextInput
                style={[styles.pseudoInput, { color: C.text, borderColor: C.primary, backgroundColor: C.surface }]}
                value={pseudoInput}
                onChangeText={setPseudoInput}
                autoFocus
                maxLength={24}
                placeholder="Votre pseudo"
                placeholderTextColor={C.textMuted}
              />
              <TouchableOpacity onPress={handleSavePseudo} disabled={isLoading} style={styles.pseudoActionBtn}>
                {isLoading
                  ? <ActivityIndicator size="small" color={C.success} />
                  : <Ionicons name="checkmark" size={20} color={C.success} />}
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCancelPseudo} style={styles.pseudoActionBtn}>
                <Ionicons name="close" size={20} color={C.danger} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.pseudoRow} onPress={handleEditPseudo} activeOpacity={0.7}>
              <Text style={styles.displayName}>{user.pseudo}</Text>
              <Ionicons name="pencil-outline" size={14} color={C.textMuted} />
            </TouchableOpacity>
          )}
          <Text style={styles.pseudoHint}>Pseudo public · appuyez pour modifier</Text>
          <View style={styles.roleRow}>
            <View style={[styles.roleBadge, getRoleStyle(user.role, C)]}>
              <Ionicons name={getRoleIcon(user.role) as any} size={12} color="#fff" />
              <Text style={styles.roleText}>{getRoleLabel(user.role)}</Text>
            </View>
            {user.isVerified && (
              <View style={[styles.verifiedBadge, { borderColor: C.success }]}>
                <Ionicons name="checkmark-circle" size={12} color={C.success} />
                <Text style={[styles.roleText, { color: C.success }]}>Vérifié</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Trust Score */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.sectionTitle}>Score de Confiance</Text>
          <TrustBadge score={user.trustScore} />
        </View>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${user.trustScore}%`,
                backgroundColor: getTrustColor(user.trustScore, C),
              },
            ]}
          />
        </View>
        <Text style={styles.trustHint}>
          Basé sur l'historique de vos signalements validés
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.statsGrid}>
        <StatBox label="Signalements" value={user.reportCount} icon="document-text" C={C} />
        <StatBox
          label="Validés"
          value={user.validatedReports}
          icon="checkmark-circle"
          color={C.success}
          C={C}
        />
        <StatBox
          label="Faux"
          value={user.falseReports}
          icon="close-circle"
          color={C.danger}
          C={C}
        />
        <StatBox
          label="Précision"
          value={`${accuracy}%`}
          icon="analytics"
          color={C.primary}
          C={C}
        />
      </View>

      {/* Appearance */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="color-palette-outline" size={18} color={C.primary} />
          <Text style={styles.sectionTitle}>Apparence</Text>
        </View>
        <View style={styles.themeToggle}>
          {THEME_OPTIONS.map((opt) => {
            const active = mode === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[styles.themeBtn, active && styles.themeBtnActive]}
                onPress={() => setMode(opt.key)}
                activeOpacity={0.75}
              >
                <Ionicons
                  name={opt.icon as any}
                  size={18}
                  color={active ? '#fff' : C.textMuted}
                />
                <Text style={[styles.themeBtnLabel, active && styles.themeBtnLabelActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Security info */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Sécurité Opérationnelle</Text>
        <InfoRow icon="eye-off-outline" text="Votre position exacte n'est jamais partagée publiquement" C={C} />
        <InfoRow icon="time-outline" text="Délai de 2 min avant publication pour éviter les diversions" C={C} />
        <InfoRow icon="shield-checkmark-outline" text="Vos signalements sont chiffrés et journalisés" C={C} />
        <InfoRow icon="people-outline" text="3 confirmations indépendantes requises avant publication" C={C} />
      </View>

      {/* Notification settings */}
      <View style={styles.card}>
        <View style={styles.notifHeader}>
          <Ionicons name="notifications" size={18} color={C.primary} />
          <Text style={styles.sectionTitle}>Notifications</Text>
          {!permissionGranted && (
            <View style={styles.permDeniedPill}>
              <Text style={styles.permDeniedText}>Permission refusée</Text>
            </View>
          )}
        </View>

        <View style={styles.notifRow}>
          <View style={styles.notifRowInfo}>
            <Text style={styles.notifRowLabel}>Activer les notifications</Text>
            <Text style={styles.notifRowDesc}>
              Soyez alerté des incidents dans votre zone
            </Text>
          </View>
          <Switch
            value={enabled}
            onValueChange={(v) => setEnabled(v)}
            trackColor={{ true: C.primary, false: C.border }}
            thumbColor={enabled ? C.text : C.textMuted}
          />
        </View>

        {enabled && (
          <>
            <View style={[styles.notifRow, styles.notifRowIndented]}>
              <View style={styles.notifRowInfo}>
                <Text style={styles.notifRowLabel}>Critiques uniquement</Text>
                <Text style={styles.notifRowDesc}>
                  Seulement niveau 4 (fusillade, kidnapping…)
                </Text>
              </View>
              <Switch
                value={criticalOnly}
                onValueChange={setCriticalOnly}
                trackColor={{ true: C.danger, false: C.border }}
                thumbColor={criticalOnly ? C.text : C.textMuted}
              />
            </View>

            <TouchableOpacity
              style={[styles.notifRow, styles.notifRowIndented]}
              onPress={() => setCityPickerVisible(true)}
            >
              <View style={styles.notifRowInfo}>
                <Text style={styles.notifRowLabel}>Ville surveillée</Text>
                <Text style={[styles.notifRowDesc, watchedCity && { color: C.primary }]}>
                  {watchedCity ?? 'Tout Haïti (aucun filtre)'}
                </Text>
              </View>
              <View style={styles.notifCityRight}>
                {watchedCity && (
                  <TouchableOpacity
                    onPress={() => setWatchedCity(null)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close-circle" size={18} color={C.textMuted} />
                  </TouchableOpacity>
                )}
                <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
              </View>
            </TouchableOpacity>
          </>
        )}
      </View>

      <CityZonePicker
        visible={cityPickerVisible}
        onClose={() => setCityPickerVisible(false)}
        cityOnly
        onSelect={(_label, city) => {
          setWatchedCity(city.name);
          setCityPickerVisible(false);
        }}
      />

      {/* Moderator shortcut */}
      {(user.role === 'moderator' || user.role === 'police') && (
        <TouchableOpacity
          style={styles.modBtn}
          onPress={() => router.push('/moderator')}
        >
          <Ionicons name="shield" size={20} color={C.primary} />
          <Text style={styles.modBtnText}>Espace Modérateur / Police</Text>
          <Ionicons name="chevron-forward" size={16} color={C.primary} />
        </TouchableOpacity>
      )}

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={18} color={C.danger} />
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function StatBox({
  label,
  value,
  icon,
  color,
  C,
}: {
  label: string;
  value: number | string;
  icon: string;
  color?: string;
  C: ThemeColors;
}) {
  const col = color ?? C.text;
  return (
    <View style={[statBoxStyle.box, { backgroundColor: C.dark, borderColor: C.border }]}>
      <Ionicons name={icon as any} size={20} color={col} />
      <Text style={[statBoxStyle.value, { color: col }]}>{value}</Text>
      <Text style={[statBoxStyle.label, { color: C.textMuted }]}>{label}</Text>
    </View>
  );
}

const statBoxStyle = StyleSheet.create({
  box: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
  },
  value: { fontWeight: '800', fontSize: 18 },
  label: { fontSize: 10, textAlign: 'center' },
});

function InfoRow({ icon, text, C }: { icon: string; text: string; C: ThemeColors }) {
  return (
    <View style={infoRowStyle.row}>
      <Ionicons name={icon as any} size={16} color={C.textMuted} />
      <Text style={[infoRowStyle.text, { color: C.textSecondary }]}>{text}</Text>
    </View>
  );
}

const infoRowStyle = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  text: { fontSize: 13, flex: 1, lineHeight: 18 },
});

function getRoleLabel(role: string) {
  const map: Record<string, string> = {
    anonymous: 'Anonyme',
    user: 'Citoyen',
    moderator: 'Modérateur',
    police: "Forces de l'ordre",
  };
  return map[role] ?? role;
}

function getRoleIcon(role: string) {
  const map: Record<string, string> = {
    anonymous: 'eye-off',
    user: 'person',
    moderator: 'shield-half',
    police: 'shield',
  };
  return map[role] ?? 'person';
}

function getRoleStyle(role: string, C: ThemeColors) {
  const map: Record<string, object> = {
    anonymous: { backgroundColor: C.border },
    user: { backgroundColor: C.primary },
    moderator: { backgroundColor: C.warning },
    police: { backgroundColor: C.danger },
  };
  return map[role] ?? {};
}

function getTrustColor(score: number, C: ThemeColors) {
  if (score >= 70) return C.trustHigh;
  if (score >= 40) return C.trustMed;
  return C.trustLow;
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.black },
    content: { padding: 16, gap: 16, paddingBottom: 40 },
    notAuth: {
      flex: 1,
      backgroundColor: C.black,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      padding: 24,
    },
    notAuthText: { color: C.textMuted, fontSize: 16 },
    loginBtn: {
      backgroundColor: C.primary,
      paddingVertical: 12,
      paddingHorizontal: 32,
      borderRadius: 10,
    },
    loginBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    avatarSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      backgroundColor: C.dark,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: C.border,
    },
    avatar: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: C.primary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: C.danger,
    },
    avatarText: { color: '#fff', fontSize: 26, fontWeight: '800' },
    avatarInfo: { flex: 1, gap: 4 },
    displayName: { color: C.text, fontWeight: '700', fontSize: 18 },
    pseudoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    pseudoHint: { color: C.textMuted, fontSize: 11, marginTop: 1 },
    pseudoEditRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    pseudoInput: { flex: 1, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 15, fontWeight: '700' },
    pseudoActionBtn: { padding: 4 },
    roleRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
    roleBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
    },
    verifiedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      borderWidth: 1,
    },
    roleText: { color: '#fff', fontSize: 11, fontWeight: '600' },
    card: {
      backgroundColor: C.dark,
      borderRadius: 16,
      padding: 16,
      gap: 10,
      borderWidth: 1,
      borderColor: C.border,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 8,
    },
    sectionTitle: { color: C.text, fontWeight: '700', fontSize: 15, flex: 1 },
    progressBar: {
      height: 8,
      backgroundColor: C.border,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressFill: { height: '100%', borderRadius: 4 },
    trustHint: { color: C.textMuted, fontSize: 11 },
    statsGrid: { flexDirection: 'row', gap: 10 },
    themeToggle: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 4,
    },
    themeBtn: {
      flex: 1,
      flexDirection: 'column',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: C.border,
      backgroundColor: C.surface,
    },
    themeBtnActive: {
      backgroundColor: C.primary,
      borderColor: C.primary,
    },
    themeBtnLabel: {
      color: C.textMuted,
      fontSize: 11,
      fontWeight: '600',
    },
    themeBtnLabelActive: {
      color: '#fff',
    },
    notifHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 2,
    },
    permDeniedPill: {
      backgroundColor: `${C.warning}22`,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderWidth: 1,
      borderColor: `${C.warning}55`,
      marginLeft: 'auto',
    },
    permDeniedText: { color: C.warning, fontSize: 10, fontWeight: '600' },
    notifRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: C.border,
    },
    notifRowIndented: { marginLeft: 8 },
    notifRowInfo: { flex: 1 },
    notifRowLabel: { color: C.text, fontSize: 14, fontWeight: '500' },
    notifRowDesc: { color: C.textMuted, fontSize: 11, marginTop: 1 },
    notifCityRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    modBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: `${C.primary}22`,
      borderWidth: 1,
      borderColor: C.primary,
      borderRadius: 12,
      padding: 14,
    },
    modBtnText: { color: C.primary, fontWeight: '600', fontSize: 14, flex: 1 },
    logoutBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: C.danger,
    },
    logoutText: { color: C.danger, fontWeight: '600', fontSize: 14 },
  });
}
