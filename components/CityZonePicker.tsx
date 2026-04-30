import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors } from '../constants/colors';
import { HAITI_CITIES, HaitiCity } from '../constants/config';
import { useTheme } from '../hooks/useTheme';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (zoneLabel: string, city: HaitiCity) => void;
  cityOnly?: boolean;
}

export default function CityZonePicker({ visible, onClose, onSelect, cityOnly = false }: Props) {
  const [step, setStep] = useState<'city' | 'zone'>('city');
  const [selectedCity, setSelectedCity] = useState<HaitiCity | null>(null);
  const [search, setSearch] = useState('');
  const C = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);

  const filteredCities = useMemo(
    () =>
      HAITI_CITIES.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.department.toLowerCase().includes(search.toLowerCase())
      ),
    [search]
  );

  const filteredZones = useMemo(() => {
    if (!selectedCity) return [];
    return selectedCity.zones.filter((z) =>
      z.toLowerCase().includes(search.toLowerCase())
    );
  }, [selectedCity, search]);

  const handleCityPress = (city: HaitiCity) => {
    if (cityOnly) {
      onSelect(city.name, city);
      handleClose();
    } else {
      setSelectedCity(city);
      setSearch('');
      setStep('zone');
    }
  };

  const handleZonePress = (zone: string) => {
    if (!selectedCity) return;
    onSelect(`${zone}, ${selectedCity.name}`, selectedCity);
    handleClose();
  };

  const handleEntireCity = () => {
    if (!selectedCity) return;
    onSelect(selectedCity.name, selectedCity);
    handleClose();
  };

  const handleBack = () => {
    setStep('city');
    setSearch('');
    setSelectedCity(null);
  };

  const handleClose = () => {
    setStep('city');
    setSearch('');
    setSelectedCity(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          {step === 'zone' && (
            <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color={C.text} />
            </TouchableOpacity>
          )}
          <View style={styles.headerTitle}>
            <Text style={styles.title}>
              {step === 'city' ? 'Choisir une ville' : selectedCity?.name}
            </Text>
            {step === 'zone' && (
              <Text style={styles.subtitle}>{selectedCity?.department}</Text>
            )}
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={C.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={16} color={C.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder={step === 'city' ? 'Chercher une ville…' : 'Chercher un quartier…'}
            placeholderTextColor={C.textMuted}
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={C.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* City list */}
        {step === 'city' && (
          <FlatList
            data={filteredCities}
            keyExtractor={(c) => c.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.row} onPress={() => handleCityPress(item)}>
                <View style={styles.rowIcon}>
                  <Ionicons name="business-outline" size={18} color={C.primary} />
                </View>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowLabel}>{item.name}</Text>
                  <Text style={styles.rowSub}>{item.department}</Text>
                </View>
                {!cityOnly && (
                  <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
                )}
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={styles.list}
          />
        )}

        {/* Zone list */}
        {step === 'zone' && (
          <FlatList
            data={filteredZones}
            keyExtractor={(z) => z}
            ListHeaderComponent={
              <TouchableOpacity style={[styles.row, styles.rowEntireCity]} onPress={handleEntireCity}>
                <View style={[styles.rowIcon, { backgroundColor: `${C.primary}22` }]}>
                  <Ionicons name="map-outline" size={18} color={C.primary} />
                </View>
                <Text style={[styles.rowLabel, { color: C.primary }]}>Toute la ville</Text>
              </TouchableOpacity>
            }
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.row} onPress={() => handleZonePress(item)}>
                <View style={styles.rowIcon}>
                  <Ionicons name="location-outline" size={18} color={C.textMuted} />
                </View>
                <Text style={styles.rowLabel}>{item}</Text>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Aucun quartier trouvé</Text>
            }
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: C.black,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
      gap: 10,
    },
    backBtn: {
      padding: 2,
    },
    closeBtn: {
      padding: 2,
    },
    headerTitle: {
      flex: 1,
    },
    title: {
      color: C.text,
      fontSize: 17,
      fontWeight: '700',
    },
    subtitle: {
      color: C.textMuted,
      fontSize: 12,
      marginTop: 1,
    },
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      margin: 12,
      backgroundColor: C.surface,
      borderWidth: 1,
      borderColor: C.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    searchInput: {
      flex: 1,
      color: C.text,
      fontSize: 14,
    },
    list: {
      paddingBottom: 40,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 12,
    },
    rowEntireCity: {
      backgroundColor: `${C.primary}10`,
      marginBottom: 4,
    },
    rowIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: C.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowInfo: {
      flex: 1,
    },
    rowLabel: {
      color: C.text,
      fontSize: 15,
      fontWeight: '500',
    },
    rowSub: {
      color: C.textMuted,
      fontSize: 12,
      marginTop: 1,
    },
    separator: {
      height: 1,
      backgroundColor: C.border,
      marginLeft: 64,
    },
    emptyText: {
      color: C.textMuted,
      textAlign: 'center',
      paddingTop: 40,
      fontSize: 14,
    },
  });
}
