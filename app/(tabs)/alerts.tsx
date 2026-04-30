import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors } from '../../constants/colors';
import { HAITI_CITIES } from '../../constants/config';
import { useAlertStore } from '../../store/alertStore';
import { AlertStatus } from '../../types';
import AlertCard from '../../components/AlertCard';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';

type Filter = AlertStatus | 'all';

export default function AlertsTab() {
  const { alerts } = useAlertStore();
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState<string | null>(null);
  const C = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const T = useTranslation();

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all', label: T('alertsFilterAll') },
    { key: 'active', label: T('alertsFilterActive') },
    { key: 'pending', label: T('alertsFilterPending') },
    { key: 'disputed', label: T('alertsFilterDisputed') },
    { key: 'resolved', label: T('alertsFilterResolved') },
  ];

  const filtered = alerts.filter((a) => {
    const matchesFilter = filter === 'all' || a.status === filter;
    const matchesCity = !cityFilter || a.zone.toLowerCase().includes(cityFilter.toLowerCase());
    const matchesSearch =
      !search ||
      a.zone.toLowerCase().includes(search.toLowerCase()) ||
      a.description.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesCity && matchesSearch;
  });

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={16} color={C.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder={T('alertsSearchPlaceholder')}
            placeholderTextColor={C.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={C.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* City filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.cityRow}
        contentContainerStyle={styles.cityRowContent}
      >
        <TouchableOpacity
          style={[styles.cityChip, !cityFilter && styles.cityChipActive]}
          onPress={() => setCityFilter(null)}
        >
          <Ionicons name="globe-outline" size={12} color={!cityFilter ? '#fff' : C.textMuted} />
          <Text style={[styles.cityChipText, !cityFilter && styles.cityChipTextActive]}>{T('alertsAllHaiti')}</Text>
        </TouchableOpacity>
        {HAITI_CITIES.map((city) => {
          const active = cityFilter === city.name;
          return (
            <TouchableOpacity
              key={city.id}
              style={[styles.cityChip, active && styles.cityChipActive]}
              onPress={() => setCityFilter(active ? null : city.name)}
            >
              <Ionicons name="location-outline" size={12} color={active ? '#fff' : C.textMuted} />
              <Text style={[styles.cityChipText, active && styles.cityChipTextActive]}>{city.name}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Status filters */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => {
          const count = f.key === 'all'
            ? alerts.length
            : alerts.filter((a) => a.status === f.key).length;
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterBtn, filter === f.key && styles.filterBtnActive]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
                {f.label}
              </Text>
              {count > 0 && (
                <View style={[styles.filterBadge, filter === f.key && styles.filterBadgeActive]}>
                  <Text style={[styles.filterBadgeText, filter === f.key && styles.filterBadgeTextActive]}>
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Active city label */}
      {cityFilter && (
        <View style={styles.activeCityRow}>
          <Ionicons name="location" size={13} color={C.primary} />
          <Text style={styles.activeCityText}>{cityFilter}</Text>
          <TouchableOpacity onPress={() => setCityFilter(null)}>
            <Ionicons name="close-circle" size={15} color={C.textMuted} />
          </TouchableOpacity>
        </View>
      )}

      {/* Alert list */}
      <FlatList
        data={filtered}
        keyExtractor={(a) => a.id}
        renderItem={({ item }) => <AlertCard alert={item} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="checkmark-circle-outline" size={48} color={C.success} />
            <Text style={styles.emptyText}>{T('alertsEmpty')}</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/report/new')}>
        <Ionicons name="add" size={26} color="#fff" />
        <Text style={styles.fabText}>{T('alertsFab')}</Text>
      </TouchableOpacity>
    </View>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.black },
    searchRow: {
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: C.surface,
      borderWidth: 1,
      borderColor: C.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    searchInput: {
      flex: 1,
      color: C.text,
      fontSize: 14,
    },
    cityRow: {
      maxHeight: 40,
      marginBottom: 6,
    },
    cityRowContent: {
      paddingHorizontal: 12,
      gap: 6,
      alignItems: 'center',
    },
    cityChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.border,
      backgroundColor: C.dark,
    },
    cityChipActive: {
      backgroundColor: C.primary,
      borderColor: C.primary,
    },
    cityChipText: {
      color: C.textMuted,
      fontSize: 12,
      fontWeight: '500',
    },
    cityChipTextActive: {
      color: '#fff',
      fontWeight: '700',
    },
    filterRow: {
      flexDirection: 'row',
      paddingHorizontal: 12,
      gap: 6,
      marginBottom: 6,
      flexWrap: 'wrap',
    },
    filterBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: C.border,
      backgroundColor: C.dark,
    },
    filterBtnActive: {
      borderColor: C.danger,
      backgroundColor: `${C.danger}22`,
    },
    filterText: {
      color: C.textMuted,
      fontSize: 12,
      fontWeight: '500',
    },
    filterTextActive: {
      color: C.danger,
      fontWeight: '700',
    },
    filterBadge: {
      backgroundColor: C.border,
      borderRadius: 10,
      paddingHorizontal: 5,
      paddingVertical: 1,
      minWidth: 18,
      alignItems: 'center',
    },
    filterBadgeActive: {
      backgroundColor: C.danger,
    },
    filterBadgeText: {
      color: C.textMuted,
      fontSize: 10,
      fontWeight: '700',
    },
    filterBadgeTextActive: {
      color: '#fff',
    },
    activeCityRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 16,
      paddingBottom: 6,
    },
    activeCityText: {
      flex: 1,
      color: C.primary,
      fontSize: 12,
      fontWeight: '600',
    },
    list: {
      paddingHorizontal: 16,
      paddingBottom: 100,
    },
    empty: {
      alignItems: 'center',
      paddingTop: 60,
      gap: 12,
    },
    emptyText: {
      color: C.textMuted,
      fontSize: 14,
    },
    fab: {
      position: 'absolute',
      bottom: 24,
      right: 20,
      backgroundColor: C.danger,
      borderRadius: 28,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 14,
      paddingHorizontal: 20,
      elevation: 8,
      shadowColor: C.danger,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
    },
    fabText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 15,
    },
  });
}
