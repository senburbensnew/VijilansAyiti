import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors } from '../../constants/colors';
import { useTheme } from '../../hooks/useTheme';
import { useAlertStore } from '../../store/alertStore';
import { useAuthStore } from '../../store/authStore';
import AlertCard from '../../components/AlertCard';
import { Alert as AlertType } from '../../types';

export default function ModeratorDashboard() {
  const C = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { user } = useAuthStore();
  const { alerts, confirmAlert, disputeAlert } = useAlertStore();
  const [tab, setTab] = useState<'pending' | 'disputed' | 'active'>('pending');

  if (!user || (user.role !== 'moderator' && user.role !== 'police')) {
    return (
      <View style={styles.noAccess}>
        <Ionicons name="lock-closed" size={48} color={C.danger} />
        <Text style={styles.noAccessText}>Accès réservé aux modérateurs et forces de l'ordre</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const filtered = alerts.filter((a) => a.status === tab);

  const handleValidate = (a: AlertType) => {
    Alert.alert('Valider l\'alerte', `Valider: "${a.category}" dans ${a.zone} ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Valider', onPress: () => confirmAlert(a.id) },
    ]);
  };

  const handleMarkFalse = (a: AlertType) => {
    Alert.alert('Marquer comme fausse alerte', 'Cette alerte sera archivée comme fausse.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Confirmer',
        style: 'destructive',
        onPress: () => disputeAlert(a.id),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.roleBadge}>
          <Ionicons name="shield" size={16} color="#fff" />
          <Text style={styles.roleText}>
            {user.role === 'police' ? 'Forces de l\'ordre' : 'Modérateur'}
          </Text>
        </View>
        <Text style={styles.headerNote}>
          Vous voyez les coordonnées exactes et les infos complètes
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {(['pending', 'disputed', 'active'] as const).map((s) => {
          const count = alerts.filter((a) => a.status === s).length;
          const label = s === 'pending' ? 'En attente' : s === 'disputed' ? 'Contestées' : 'Actives';
          const color = s === 'pending' ? C.warning : s === 'disputed' ? C.danger : C.success;
          return (
            <TouchableOpacity
              key={s}
              style={[styles.statBtn, tab === s && { borderColor: color, backgroundColor: `${color}22` }]}
              onPress={() => setTab(s)}
            >
              <Text style={[styles.statNum, { color }]}>{count}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(a) => a.id}
        renderItem={({ item }) => (
          <View style={styles.modCard}>
            <AlertCard alert={item} />
            {/* Exact location */}
            <View style={styles.privateBox}>
              <Ionicons name="location" size={14} color={C.primary} />
              <Text style={styles.privateCoords}>
                GPS: {item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}
              </Text>
            </View>
            {/* Moderator actions */}
            {tab !== 'active' && (
              <View style={styles.modActions}>
                <TouchableOpacity
                  style={styles.validateBtn}
                  onPress={() => handleValidate(item)}
                >
                  <Ionicons name="checkmark-circle" size={16} color={C.success} />
                  <Text style={[styles.modActionText, { color: C.success }]}>
                    Valider
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.falseBtn}
                  onPress={() => handleMarkFalse(item)}
                >
                  <Ionicons name="close-circle" size={16} color={C.danger} />
                  <Text style={[styles.modActionText, { color: C.danger }]}>
                    Fausse alerte
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="checkmark-done-circle" size={48} color={C.success} />
            <Text style={styles.emptyText}>Aucune alerte dans cette catégorie</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.black },
    noAccess: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      backgroundColor: C.black,
      padding: 24,
    },
    noAccessText: { color: C.textMuted, fontSize: 14, textAlign: 'center' },
    backLink: { color: C.primary, fontSize: 14, textDecorationLine: 'underline' },
    header: {
      padding: 16,
      gap: 6,
      backgroundColor: `${C.primary}22`,
      borderBottomWidth: 1,
      borderBottomColor: C.primary,
    },
    roleBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: C.primary,
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    roleText: { color: '#fff', fontWeight: '700', fontSize: 13 },
    headerNote: { color: C.textSecondary, fontSize: 12 },
    statsRow: {
      flexDirection: 'row',
      padding: 16,
      gap: 10,
    },
    statBtn: {
      flex: 1,
      backgroundColor: C.dark,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: C.border,
      padding: 12,
      alignItems: 'center',
      gap: 2,
    },
    statNum: { fontWeight: '800', fontSize: 22 },
    statLabel: { color: C.textMuted, fontSize: 11, fontWeight: '500' },
    list: { paddingHorizontal: 16, paddingBottom: 40 },
    modCard: {
      marginBottom: 16,
      gap: 6,
    },
    privateBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: `${C.primary}15`,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: `${C.primary}44`,
    },
    privateCoords: { color: C.primary, fontSize: 12, fontWeight: '500' },
    modActions: {
      flexDirection: 'row',
      gap: 8,
    },
    validateBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: `${C.success}22`,
      borderRadius: 10,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: C.success,
    },
    falseBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: `${C.danger}22`,
      borderRadius: 10,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: C.danger,
    },
    modActionText: { fontWeight: '600', fontSize: 13 },
    empty: {
      alignItems: 'center',
      paddingTop: 60,
      gap: 12,
    },
    emptyText: { color: C.textMuted, fontSize: 14 },
  });
}
