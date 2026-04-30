import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors } from '../constants/colors';
import { useTheme } from '../hooks/useTheme';

interface Props {
  score: number;
  size?: 'sm' | 'md';
}

function getTrustColor(score: number, C: ThemeColors) {
  if (score >= 70) return C.trustHigh;
  if (score >= 40) return C.trustMed;
  return C.trustLow;
}

function getTrustLabel(score: number) {
  if (score >= 70) return 'Fiable';
  if (score >= 40) return 'Modéré';
  return 'Faible';
}

export default function TrustBadge({ score, size = 'md' }: Props) {
  const C = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const color = getTrustColor(score, C);
  const label = getTrustLabel(score);
  const isSmall = size === 'sm';

  return (
    <View style={[styles.container, { borderColor: color }, isSmall && styles.small]}>
      <Ionicons
        name="shield-checkmark"
        size={isSmall ? 10 : 12}
        color={color}
      />
      <Text style={[styles.score, { color }, isSmall && styles.textSmall]}>
        {score}
      </Text>
      {!isSmall && (
        <Text style={[styles.label, { color }]}>{label}</Text>
      )}
    </View>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 20,
      borderWidth: 1,
      backgroundColor: C.surface,
    },
    small: {
      paddingHorizontal: 5,
      paddingVertical: 2,
    },
    score: {
      fontSize: 12,
      fontWeight: '700',
    },
    textSmall: {
      fontSize: 10,
    },
    label: {
      fontSize: 11,
      fontWeight: '500',
    },
  });
}
