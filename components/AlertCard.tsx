import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert as RNAlert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Alert } from '../types';
import { ThemeColors } from '../constants/colors';
import { ALERT_CATEGORIES, SEVERITY_LABELS } from '../constants/config';
import ConfirmationBadge from './ConfirmationBadge';
import { useAlertStore } from '../store/alertStore';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../hooks/useTheme';

interface Props {
  alert: Alert;
  compact?: boolean;
}

function timeAgo(date: string) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}j`;
}

const SEVERITY_COLORS: Record<number, string> = {
  1: '#FFD700',
  2: '#FF8C00',
  3: '#FF4500',
  4: '#FF0000',
};

export default function AlertCard({ alert, compact = false }: Props) {
  const { confirmAlert, disputeAlert } = useAlertStore();
  const { user } = useAuthStore();
  const C = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);

  const category = ALERT_CATEGORIES[alert.category];
  const severityColor = SEVERITY_COLORS[alert.severity];

  const handleConfirm = () => {
    confirmAlert(alert.id);
    RNAlert.alert('Merci', 'Votre confirmation a été enregistrée.');
  };

  const handleDispute = () => {
    RNAlert.alert(
      'Signaler comme faux',
      'Êtes-vous sûr de vouloir contester cette alerte ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          style: 'destructive',
          onPress: () => disputeAlert(alert.id),
        },
      ]
    );
  };

  const isPending = alert.status === 'pending';
  const isResolved = alert.status === 'resolved' || alert.status === 'false_alarm';

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { borderLeftColor: severityColor },
        isPending && styles.cardPending,
        isResolved && styles.cardResolved,
      ]}
      onPress={() => router.push(`/report/${alert.id}`)}
      activeOpacity={0.85}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.categoryRow}>
          <View style={[styles.categoryIcon, { backgroundColor: `${category.color}22` }]}>
            <Ionicons name={category.icon as any} size={16} color={category.color} />
          </View>
          <View>
            <Text style={styles.categoryLabel}>{category.label}</Text>
            <Text style={styles.zone}>
              <Ionicons name="location-outline" size={11} color={C.textMuted} />
              {' '}{alert.zone}
            </Text>
          </View>
        </View>
        <View style={styles.metaRight}>
          <View style={[styles.severityBadge, { backgroundColor: `${severityColor}22`, borderColor: severityColor }]}>
            <Text style={[styles.severityText, { color: severityColor }]}>
              {SEVERITY_LABELS[alert.severity]}
            </Text>
          </View>
          <Text style={styles.timeAgo}>
            {timeAgo(alert.reportedAt)}
          </Text>
        </View>
      </View>

      {/* Description */}
      {!compact && (
        <Text style={styles.description} numberOfLines={2}>
          {alert.description}
        </Text>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <ConfirmationBadge confirmations={alert.confirmations} />

        {alert.isAnonymous ? (
          <View style={styles.anonBadge}>
            <Ionicons name="eye-off-outline" size={11} color={C.textMuted} />
            <Text style={styles.anonText}>Anonyme</Text>
          </View>
        ) : null}

        {isPending && (
          <View style={styles.statusBadge}>
            <Ionicons name="time-outline" size={11} color={C.warning} />
            <Text style={[styles.statusText, { color: C.warning }]}>En attente</Text>
          </View>
        )}

        {isResolved && (
          <View style={[styles.statusBadge, { borderColor: C.textMuted }]}>
            <Ionicons name="checkmark-done" size={11} color={C.textMuted} />
            <Text style={[styles.statusText, { color: C.textMuted }]}>Résolu</Text>
          </View>
        )}
      </View>

      {/* Actions */}
      {!isResolved && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
            <Ionicons name="checkmark-circle-outline" size={14} color={C.success} />
            <Text style={[styles.actionText, { color: C.success }]}>Confirmer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.disputeBtn} onPress={handleDispute}>
            <Ionicons name="flag-outline" size={14} color={C.textMuted} />
            <Text style={[styles.actionText, { color: C.textMuted }]}>Faux signal</Text>
          </TouchableOpacity>
          {(user?.role === 'police' || user?.role === 'moderator') && (
            <View style={styles.privateInfo}>
              <Ionicons name="lock-closed" size={11} color={C.primary} />
              <Text style={[styles.actionText, { color: C.primary }]}>
                {alert.latitude.toFixed(4)}, {alert.longitude.toFixed(4)}
              </Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: C.dark,
      borderRadius: 12,
      borderLeftWidth: 4,
      padding: 14,
      marginBottom: 10,
      gap: 10,
    },
    cardPending: {
      opacity: 0.8,
      borderStyle: 'dashed',
    },
    cardResolved: {
      opacity: 0.55,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    categoryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    categoryIcon: {
      width: 32,
      height: 32,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    categoryLabel: {
      color: C.text,
      fontWeight: '600',
      fontSize: 13,
    },
    zone: {
      color: C.textMuted,
      fontSize: 11,
      marginTop: 1,
    },
    metaRight: {
      alignItems: 'flex-end',
      gap: 4,
    },
    severityBadge: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 10,
      borderWidth: 1,
    },
    severityText: {
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    timeAgo: {
      color: C.textMuted,
      fontSize: 11,
    },
    description: {
      color: C.textSecondary,
      fontSize: 13,
      lineHeight: 18,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
    },
    anonBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },
    anonText: {
      color: C.textMuted,
      fontSize: 11,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: C.warning,
    },
    statusText: {
      fontSize: 10,
      fontWeight: '600',
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderTopWidth: 1,
      borderTopColor: C.border,
      paddingTop: 10,
    },
    confirmBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    disputeBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    privateInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginLeft: 'auto',
    },
    actionText: {
      fontSize: 12,
      fontWeight: '500',
    },
  });
}
