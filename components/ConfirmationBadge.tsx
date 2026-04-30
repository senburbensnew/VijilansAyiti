import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors } from '../constants/colors';
import { CONFIRMATIONS_REQUIRED } from '../constants/config';
import { useTheme } from '../hooks/useTheme';

interface Props {
  confirmations: number;
  required?: number;
}

export default function ConfirmationBadge({
  confirmations,
  required = CONFIRMATIONS_REQUIRED,
}: Props) {
  const C = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const isConfirmed = confirmations >= required;
  const color = isConfirmed ? C.success : C.warning;

  return (
    <View style={[styles.container, { borderColor: color }]}>
      <Ionicons
        name={isConfirmed ? 'checkmark-circle' : 'time'}
        size={12}
        color={color}
      />
      <Text style={[styles.text, { color }]}>
        {confirmations} confirmation{confirmations > 1 ? 's' : ''}
        {!isConfirmed && ` / ${required} requises`}
      </Text>
    </View>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 20,
      borderWidth: 1,
      backgroundColor: C.surface,
    },
    text: {
      fontSize: 11,
      fontWeight: '500',
    },
  });
}
