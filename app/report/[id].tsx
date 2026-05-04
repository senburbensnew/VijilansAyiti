import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert as RNAlert,
  Image,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors } from '../../constants/colors';
import { useTheme } from '../../hooks/useTheme';
import { ALERT_CATEGORIES, SEVERITY_LABELS } from '../../constants/config';
import { useAlertStore } from '../../store/alertStore';
import { useAuthStore } from '../../store/authStore';
import ConfirmationBadge from '../../components/ConfirmationBadge';
import TrustBadge from '../../components/TrustBadge';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('fr-HT', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AlertDetail() {
  const C = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);

  const SEVERITY_COLORS: Record<number, string> = {
    1: C.severityLow,
    2: C.severityMedium,
    3: C.severityHigh,
    4: C.severityCritical,
  };

  const { id } = useLocalSearchParams<{ id: string }>();
  const { alerts, confirmAlert, disputeAlert } = useAlertStore();
  const { user } = useAuthStore();
  const alert = alerts.find((a) => a.id === id);

  if (!alert) {
    return (
      <View style={styles.notFound}>
        <Ionicons name="alert-circle-outline" size={48} color={C.textMuted} />
        <Text style={styles.notFoundText}>Alerte introuvable</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const category = ALERT_CATEGORIES[alert.category];
  const sevColor = SEVERITY_COLORS[alert.severity];
  const isLEO = user?.role === 'police' || user?.role === 'moderator';

  const handleConfirm = () => {
    confirmAlert(alert.id);
    RNAlert.alert('Merci', 'Confirmation enregistrée.');
  };

  const handleDispute = () => {
    RNAlert.alert('Signaler comme faux', 'Contester cette alerte ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Contester',
        style: 'destructive',
        onPress: () => disputeAlert(alert.id),
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Severity banner */}
      <View style={[styles.banner, { backgroundColor: `${sevColor}22`, borderColor: sevColor }]}>
        <Ionicons name={category.icon as any} size={24} color={sevColor} />
        <View style={styles.bannerText}>
          <Text style={[styles.bannerCategory, { color: sevColor }]}>{category.label}</Text>
          <Text style={[styles.bannerSeverity, { color: sevColor }]}>
            Gravité: {SEVERITY_LABELS[alert.severity]}
          </Text>
        </View>
        <View style={[styles.severityCircle, { backgroundColor: sevColor }]}>
          <Text style={styles.severityNum}>{alert.severity}</Text>
        </View>
      </View>

      {/* Status */}
      <View style={styles.statusRow}>
        <StatusChip status={alert.status} />
        <ConfirmationBadge confirmations={alert.confirmations} />
      </View>

      {/* Zone */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons name="location" size={18} color={C.danger} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Zone publique</Text>
            <Text style={styles.infoValue}>{alert.zone}</Text>
          </View>
        </View>

        {/* Exact coords — only for LEO */}
        {isLEO && (
          <View style={[styles.infoRow, styles.privateRow]}>
            <Ionicons name="lock-closed" size={18} color={C.primary} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: C.primary }]}>
                Position exacte (Forces de l'ordre)
              </Text>
              <Text style={[styles.infoValue, { color: C.primary }]}>
                {alert.latitude.toFixed(6)}, {alert.longitude.toFixed(6)}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={18} color={C.textMuted} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Signalé le</Text>
            <Text style={styles.infoValue}>{formatDate(alert.reportedAt)}</Text>
          </View>
        </View>

        {alert.publishedAt && (
          <View style={styles.infoRow}>
            <Ionicons name="eye-outline" size={18} color={C.success} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Publié le</Text>
              <Text style={[styles.infoValue, { color: C.success }]}>
                {formatDate(alert.publishedAt)}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.infoRow}>
          <Ionicons
            name={alert.isAnonymous ? 'eye-off-outline' : 'person-outline'}
            size={18}
            color={C.textMuted}
          />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Signalé par</Text>
            <Text style={styles.infoValue}>
              {alert.isAnonymous ? 'Utilisateur anonyme' : `Citoyen vérifié`}
            </Text>
          </View>
        </View>
      </View>

      {/* Description */}
      <View style={styles.descCard}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{alert.description}</Text>
      </View>

      {/* Bandit info */}
      {alert.banditInfo && (
        <View style={styles.banditCard}>
          <View style={styles.banditCardHeader}>
            <Ionicons name="eye" size={16} color="#DC2626" />
            <Text style={styles.banditCardTitle}>Informations sur le(s) bandit(s)</Text>
          </View>
          {alert.banditInfo.nombreBandits != null && (
            <BanditRow icon="people-outline" label="Nombre" value={String(alert.banditInfo.nombreBandits)} />
          )}
          {alert.banditInfo.descriptionPhysique && (
            <BanditRow icon="body-outline" label="Description physique" value={alert.banditInfo.descriptionPhysique} />
          )}
          {alert.banditInfo.vetements && (
            <BanditRow icon="shirt-outline" label="Vêtements" value={alert.banditInfo.vetements} />
          )}
          <BanditRow
            icon="warning-outline"
            label="Armé"
            value={alert.banditInfo.arme ? `Oui${alert.banditInfo.typeArme ? ` — ${alert.banditInfo.typeArme}` : ''}` : 'Non'}
          />
          {alert.banditInfo.directionFuite && (
            <BanditRow icon="navigate-outline" label="Direction de fuite" value={alert.banditInfo.directionFuite} />
          )}
        </View>
      )}

      {/* Media */}
      {alert.mediaUris && alert.mediaUris.length > 0 && (
        <View style={styles.mediaCard}>
          <Text style={styles.sectionTitle}>Photos / Vidéos jointes</Text>
          <View style={styles.mediaGrid}>
            {alert.mediaUris.map((uri) => (
              <Image key={uri} source={{ uri }} style={styles.mediaThumb} />
            ))}
          </View>
        </View>
      )}

      {/* Dispute info */}
      {alert.disputeCount > 0 && (
        <View style={styles.disputeCard}>
          <Ionicons name="flag" size={16} color={C.warning} />
          <Text style={styles.disputeText}>
            {alert.disputeCount} utilisateur{alert.disputeCount > 1 ? 's ont' : ' a'} contesté cette alerte
          </Text>
        </View>
      )}

      {/* Anti-abuse notice */}
      {alert.status === 'pending' && (
        <View style={styles.pendingNote}>
          <Ionicons name="information-circle-outline" size={16} color={C.warning} />
          <Text style={styles.pendingText}>
            Cette alerte est en attente de {3 - alert.confirmations} confirmation{3 - alert.confirmations > 1 ? 's' : ''} supplémentaire{3 - alert.confirmations > 1 ? 's' : ''} avant d'être visible publiquement.
          </Text>
        </View>
      )}

      {/* Actions */}
      {alert.status !== 'resolved' && alert.status !== 'false_alarm' && (
        <View style={styles.actionsCard}>
          <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
            <Ionicons name="checkmark-circle" size={20} color={C.success} />
            <Text style={[styles.actionText, { color: C.success }]}>
              Je confirme cette alerte
            </Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.disputeBtn} onPress={handleDispute}>
            <Ionicons name="flag-outline" size={20} color={C.warning} />
            <Text style={[styles.actionText, { color: C.warning }]}>
              Signaler comme fausse alerte
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

function BanditRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  const C = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start', paddingVertical: 6, borderTopWidth: 1, borderTopColor: '#DC262620' }}>
      <Ionicons name={icon as any} size={16} color="#DC2626" style={{ marginTop: 1 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#999', fontSize: 11 }}>{label}</Text>
        <Text style={{ color: C.text, fontSize: 14 }}>{value}</Text>
      </View>
    </View>
  );
}

function StatusChip({ status }: { status: string }) {
  const C = useTheme();
  const map: Record<string, { label: string; color: string; icon: string }> = {
    pending: { label: 'En attente', color: C.warning, icon: 'time' },
    active: { label: 'Active', color: C.danger, icon: 'radio' },
    disputed: { label: 'Contestée', color: C.warning, icon: 'flag' },
    resolved: { label: 'Résolue', color: C.success, icon: 'checkmark-circle' },
    false_alarm: { label: 'Fausse alerte', color: C.textMuted, icon: 'close-circle' },
  };
  const s = map[status] ?? map.pending;
  return (
    <View style={[chipStyle.chip, { borderColor: s.color, backgroundColor: `${s.color}22` }]}>
      <Ionicons name={s.icon as any} size={13} color={s.color} />
      <Text style={[chipStyle.text, { color: s.color }]}>{s.label}</Text>
    </View>
  );
}

const chipStyle = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  text: { fontWeight: '700', fontSize: 12 },
});

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.black },
    content: { padding: 16, gap: 12, paddingBottom: 40 },
    notFound: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      backgroundColor: C.black,
    },
    notFoundText: { color: C.textMuted, fontSize: 16 },
    backLink: { color: C.primary, fontSize: 14, textDecorationLine: 'underline' },
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
    },
    bannerText: { flex: 1 },
    bannerCategory: { fontWeight: '700', fontSize: 16 },
    bannerSeverity: { fontSize: 12, marginTop: 2, fontWeight: '500' },
    severityCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    severityNum: { color: '#fff', fontWeight: '800', fontSize: 16 },
    statusRow: {
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
    },
    infoCard: {
      backgroundColor: C.dark,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: C.border,
      overflow: 'hidden',
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      padding: 14,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
    },
    privateRow: {
      backgroundColor: `${C.primary}15`,
    },
    infoContent: { flex: 1 },
    infoLabel: { color: C.textMuted, fontSize: 11, marginBottom: 2 },
    infoValue: { color: C.text, fontSize: 14, fontWeight: '500' },
    descCard: {
      backgroundColor: C.dark,
      borderRadius: 14,
      padding: 16,
      gap: 8,
      borderWidth: 1,
      borderColor: C.border,
    },
    sectionTitle: { color: C.text, fontWeight: '700', fontSize: 15 },
    description: { color: C.textSecondary, fontSize: 14, lineHeight: 21 },
    disputeCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: `${C.warning}15`,
      borderRadius: 10,
      padding: 12,
      borderWidth: 1,
      borderColor: `${C.warning}44`,
    },
    disputeText: { color: C.warning, fontSize: 13, flex: 1 },
    pendingNote: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      backgroundColor: `${C.warning}15`,
      borderRadius: 10,
      padding: 12,
      borderWidth: 1,
      borderColor: `${C.warning}44`,
    },
    pendingText: { color: C.warning, fontSize: 12, flex: 1, lineHeight: 18 },
    actionsCard: {
      backgroundColor: C.dark,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: C.border,
      overflow: 'hidden',
    },
    confirmBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 16,
    },
    disputeBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 16,
    },
    divider: {
      height: 1,
      backgroundColor: C.border,
      marginHorizontal: 16,
    },
    actionText: { fontSize: 14, fontWeight: '600' },
    banditCard: {
      backgroundColor: '#1a0808',
      borderRadius: 14,
      padding: 16,
      gap: 2,
      borderWidth: 1,
      borderColor: '#DC262655',
    },
    banditCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 6,
    },
    banditCardTitle: {
      color: '#DC2626',
      fontWeight: '700',
      fontSize: 14,
    },
    mediaCard: {
      backgroundColor: C.dark,
      borderRadius: 14,
      padding: 16,
      gap: 10,
      borderWidth: 1,
      borderColor: C.border,
    },
    mediaGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    mediaThumb: {
      width: 80,
      height: 80,
      borderRadius: 8,
      backgroundColor: C.surface,
    },
  });
}
