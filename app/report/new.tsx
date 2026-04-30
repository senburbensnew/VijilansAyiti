import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors } from '../../constants/colors';
import { useTheme } from '../../hooks/useTheme';
import { ALERT_CATEGORIES, HaitiCity } from '../../constants/config';
import { AlertCategory } from '../../types';
import { useAlertStore } from '../../store/alertStore';
import { useAuthStore } from '../../store/authStore';
import CityZonePicker from '../../components/CityZonePicker';

export default function NewReport() {
  const C = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);

  const SEVERITIES: { value: 1 | 2 | 3 | 4; label: string; color: string }[] = [
    { value: 1, label: 'Faible', color: C.severityLow },
    { value: 2, label: 'Modéré', color: C.severityMedium },
    { value: 3, label: 'Élevé', color: C.severityHigh },
    { value: 4, label: 'Critique', color: C.severityCritical },
  ];

  const [category, setCategory] = useState<AlertCategory>('vol');
  const [description, setDescription] = useState('');
  const [zone, setZone] = useState('');
  const [selectedCity, setSelectedCity] = useState<HaitiCity | null>(null);
  const [severity, setSeverity] = useState<1 | 2 | 3 | 4>(2);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const { addAlert } = useAlertStore();
  const { user } = useAuthStore();

  const canSubmit = description.trim().length >= 10 && zone.trim().length >= 3;

  const handleZoneSelect = (zoneLabel: string, city: HaitiCity) => {
    setZone(zoneLabel);
    setSelectedCity(city);
  };

  const handleSubmit = () => {
    if (!canSubmit) return;

    Alert.alert(
      'Confirmation du signalement',
      `Votre signalement sera publié après:\n• ${3} confirmations indépendantes\n• Un délai de 2 minutes (sécurité opérationnelle)\n\nContinuer ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Signaler',
          onPress: async () => {
            setIsLoading(true);
            const baseLat = selectedCity ? selectedCity.latitude : 18.54;
            const baseLng = selectedCity ? selectedCity.longitude : -72.34;
            await addAlert({
              category,
              description: description.trim(),
              zone: zone.trim(),
              latitude: baseLat + (Math.random() - 0.5) * 0.05,
              longitude: baseLng + (Math.random() - 0.5) * 0.05,
              reportedAt: new Date().toISOString(),
              status: 'pending',
              severity,
              confirmations: 0,
              disputeCount: 0,
              isAnonymous: isAnonymous || !user,
              reporterId: isAnonymous ? undefined : user?.id,
              publicView: true,
            });
            setIsLoading(false);
            Alert.alert(
              'Signalement enregistré',
              'Merci. Votre signalement sera visible publiquement après 3 confirmations et un délai de sécurité.',
              [{ text: 'OK', onPress: () => router.back() }]
            );
          },
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Nouveau Signalement',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
              <Ionicons name="close" size={22} color={C.text} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Category */}
        <Text style={styles.label}>Type d'incident *</Text>
        <View style={styles.categoryGrid}>
          {(Object.entries(ALERT_CATEGORIES) as [AlertCategory, typeof ALERT_CATEGORIES[AlertCategory]][]).map(([key, cat]) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.categoryBtn,
                category === key && {
                  borderColor: cat.color,
                  backgroundColor: `${cat.color}22`,
                },
              ]}
              onPress={() => setCategory(key)}
            >
              <Ionicons name={cat.icon as any} size={20} color={category === key ? cat.color : C.textMuted} />
              <Text
                style={[
                  styles.categoryBtnText,
                  category === key && { color: cat.color, fontWeight: '700' },
                ]}
                numberOfLines={2}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Severity */}
        <Text style={styles.label}>Niveau de gravité *</Text>
        <View style={styles.severityRow}>
          {SEVERITIES.map((s) => (
            <TouchableOpacity
              key={s.value}
              style={[
                styles.severityBtn,
                severity === s.value && {
                  borderColor: s.color,
                  backgroundColor: `${s.color}22`,
                },
              ]}
              onPress={() => setSeverity(s.value)}
            >
              <Text
                style={[
                  styles.severityText,
                  severity === s.value && { color: s.color, fontWeight: '700' },
                ]}
              >
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Zone picker */}
        <Text style={styles.label}>Zone / Quartier *</Text>
        <TouchableOpacity
          style={[styles.zoneBtn, zone ? styles.zoneBtnSelected : null]}
          onPress={() => setPickerVisible(true)}
        >
          <Ionicons
            name="location-outline"
            size={18}
            color={zone ? C.primary : C.textMuted}
          />
          <Text style={[styles.zoneBtnText, zone && styles.zoneBtnTextSelected]} numberOfLines={1}>
            {zone || 'Choisir une ville ou un quartier…'}
          </Text>
          <Ionicons name="chevron-down" size={16} color={C.textMuted} />
        </TouchableOpacity>
        <Text style={styles.hint}>
          La position exacte n'est visible que par les forces de l'ordre
        </Text>

        {/* Description */}
        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Décrivez ce que vous avez vu (minimum 10 caractères)…"
          placeholderTextColor={C.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
        <Text style={[styles.hint, description.length < 10 && styles.hintError]}>
          {description.length}/10 caractères minimum
        </Text>

        {/* Anonymous toggle */}
        <View style={styles.anonRow}>
          <View style={styles.anonInfo}>
            <Text style={styles.anonLabel}>Signalement anonyme</Text>
            <Text style={styles.anonDesc}>
              Votre identité sera masquée. Limité à 1 signalement par appareil sans compte.
            </Text>
          </View>
          <Switch
            value={isAnonymous}
            onValueChange={setIsAnonymous}
            trackColor={{ true: C.primary, false: C.border }}
            thumbColor={isAnonymous ? C.text : C.textMuted}
          />
        </View>

        {/* Security note */}
        <View style={styles.secNote}>
          <Ionicons name="information-circle-outline" size={16} color={C.primary} />
          <Text style={styles.secText}>
            Ce signalement sera soumis à vérification avant publication. Faux signalements répétés = suspension du compte.
          </Text>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="warning-outline" size={20} color="#fff" />
              <Text style={styles.submitText}>Envoyer le signalement</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      <CityZonePicker
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={handleZoneSelect}
      />
    </>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.black },
    content: { padding: 16, gap: 12, paddingBottom: 40 },
    headerBack: {
      padding: 4,
      marginLeft: 4,
    },
    label: {
      color: C.textSecondary,
      fontSize: 13,
      fontWeight: '700',
      marginBottom: 6,
      marginTop: 4,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    categoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    categoryBtn: {
      width: '47%',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: C.dark,
      borderWidth: 1,
      borderColor: C.border,
      borderRadius: 10,
      padding: 10,
    },
    categoryBtnText: {
      color: C.textMuted,
      fontSize: 12,
      flex: 1,
    },
    severityRow: {
      flexDirection: 'row',
      gap: 8,
    },
    severityBtn: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 10,
      backgroundColor: C.dark,
      borderWidth: 1,
      borderColor: C.border,
      borderRadius: 10,
    },
    severityText: {
      color: C.textMuted,
      fontSize: 12,
      fontWeight: '500',
    },
    zoneBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: C.surface,
      borderWidth: 1,
      borderColor: C.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 13,
    },
    zoneBtnSelected: {
      borderColor: C.primary,
      backgroundColor: `${C.primary}10`,
    },
    zoneBtnText: {
      flex: 1,
      color: C.textMuted,
      fontSize: 14,
    },
    zoneBtnTextSelected: {
      color: C.text,
    },
    input: {
      backgroundColor: C.surface,
      borderWidth: 1,
      borderColor: C.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: C.text,
      fontSize: 14,
    },
    textArea: {
      minHeight: 100,
      paddingTop: 12,
    },
    hint: {
      color: C.textMuted,
      fontSize: 11,
      marginTop: -6,
    },
    hintError: {
      color: C.warning,
    },
    anonRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: C.dark,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: C.border,
      marginTop: 4,
    },
    anonInfo: { flex: 1, gap: 2 },
    anonLabel: { color: C.text, fontWeight: '600', fontSize: 14 },
    anonDesc: { color: C.textMuted, fontSize: 11, lineHeight: 16 },
    secNote: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      backgroundColor: `${C.primary}15`,
      borderRadius: 10,
      padding: 12,
      borderWidth: 1,
      borderColor: `${C.primary}44`,
    },
    secText: {
      color: C.textSecondary,
      fontSize: 12,
      flex: 1,
      lineHeight: 17,
    },
    submitBtn: {
      backgroundColor: C.danger,
      borderRadius: 14,
      paddingVertical: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 8,
      elevation: 4,
      shadowColor: C.danger,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
    },
    submitBtnDisabled: {
      opacity: 0.4,
    },
    submitText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
    },
  });
}
