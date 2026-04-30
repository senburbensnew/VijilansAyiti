import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Dimensions,
} from 'react-native';
import MapView, { Marker, Callout, Circle, PROVIDER_DEFAULT, MapStyleElement } from 'react-native-maps';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useAlertStore } from '../../store/alertStore';
import { useAuthStore } from '../../store/authStore';
import AlertCard from '../../components/AlertCard';
import { Alert } from '../../types';
import { ALERT_CATEGORIES, HAITI_CITIES } from '../../constants/config';
import CityZonePicker from '../../components/CityZonePicker';
import { useTranslation } from '../../hooks/useTranslation';

const { height } = Dimensions.get('window');

// Port-au-Prince initial region
const INITIAL_REGION = {
  latitude: 18.543,
  longitude: -72.338,
  latitudeDelta: 0.18,
  longitudeDelta: 0.18,
};

// Blur radius in meters shown as circle for public view (hides exact spot)
const PUBLIC_BLUR_RADIUS = 600;

const SEVERITY_COLORS: Record<number, string> = {
  1: '#FFD700',
  2: '#FF8C00',
  3: '#FF4500',
  4: '#FF0000',
};

const LIGHT_MAP_STYLE: MapStyleElement[] = [];

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#1a1f2e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8892B0' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1f2e' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#2A3050' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#1E2235' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#6272A4' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2A3050' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#141829' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#8892B0' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3B4572' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#1E2235' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0D1117' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3B4572' }] },
];

export default function MapTab() {
  const mapRef = useRef<MapView>(null);
  const { alerts, getActiveAlerts } = useAlertStore();
  const { user } = useAuthStore();
  const C = useTheme();
  const styles = React.useMemo(() => makeStyles(C), [C]);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState(false);
  const [cityPickerVisible, setCityPickerVisible] = useState(false);

  const T = useTranslation();
  const active = getActiveAlerts();
  const critical = active.filter((a) => a.severity === 4);
  const isLEO = user?.role === 'police' || user?.role === 'moderator';

  // Alerts visible on map: active + pending
  const mapAlerts = alerts.filter((a) => a.status === 'active' || a.status === 'pending');

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError(true);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    })();
  }, []);

  const focusAlert = (a: Alert) => {
    mapRef.current?.animateToRegion(
      {
        latitude: a.latitude,
        longitude: a.longitude,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      },
      400
    );
  };

  const focusUser = () => {
    if (!userLocation) return;
    mapRef.current?.animateToRegion(
      { ...userLocation, latitudeDelta: 0.05, longitudeDelta: 0.05 },
      400
    );
  };

  return (
    <View style={styles.container}>
      {/* Critical banner */}
      {critical.length > 0 && (
        <TouchableOpacity
          style={styles.criticalBanner}
          onPress={() => router.push('/(tabs)/alerts')}
        >
          <Ionicons name="warning" size={18} color="#fff" />
          <Text style={styles.criticalText}>
            {critical.length} {critical.length > 1 ? T('mapCriticalBannerPlural') : T('mapCriticalBanner')}
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Map */}
      <View style={styles.mapWrapper}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          provider={PROVIDER_DEFAULT}
          initialRegion={INITIAL_REGION}
          customMapStyle={C.isDark ? DARK_MAP_STYLE : LIGHT_MAP_STYLE}
          showsUserLocation={!!userLocation}
          showsMyLocationButton={false}
          showsCompass={false}
          toolbarEnabled={false}
        >
          {mapAlerts.map((a) => {
            const color = SEVERITY_COLORS[a.severity];
            const cat = ALERT_CATEGORIES[a.category];
            const isPending = a.status === 'pending';

            return (
              <React.Fragment key={a.id}>
                {/* Blur circle for public — hides exact position */}
                {!isLEO && (
                  <Circle
                    center={{ latitude: a.latitude, longitude: a.longitude }}
                    radius={PUBLIC_BLUR_RADIUS}
                    fillColor={`${color}18`}
                    strokeColor={`${color}55`}
                    strokeWidth={1}
                  />
                )}

                <Marker
                  coordinate={{ latitude: a.latitude, longitude: a.longitude }}
                  opacity={isPending ? 0.6 : 1}
                  onPress={() => focusAlert(a)}
                >
                  {/* Custom marker pin */}
                  <View style={[styles.markerPin, { backgroundColor: color, borderColor: isPending ? C.warning : '#fff' }]}>
                    <Ionicons name={cat.icon as any} size={14} color="#fff" />
                  </View>

                  <Callout
                    tooltip
                    onPress={() => router.push(`/report/${a.id}`)}
                  >
                    <View style={styles.callout}>
                      <View style={[styles.calloutHeader, { borderLeftColor: color }]}>
                        <Text style={styles.calloutCategory}>{cat.label}</Text>
                        {isPending && (
                          <View style={styles.pendingPill}>
                            <Text style={styles.pendingPillText}>{T('mapCalloutPending')}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.calloutZone}>{a.zone}</Text>
                      <Text style={styles.calloutDesc} numberOfLines={2}>
                        {a.description}
                      </Text>
                      <View style={styles.calloutFooter}>
                        <Text style={styles.calloutConf}>
                          {a.confirmations} {a.confirmations !== 1 ? T('mapConfirmationPlural') : T('mapConfirmation')}
                        </Text>
                        <Text style={styles.calloutLink}>{T('mapSeeDetails')}</Text>
                      </View>
                      {isLEO && (
                        <Text style={styles.calloutCoords}>
                          GPS: {a.latitude.toFixed(5)}, {a.longitude.toFixed(5)}
                        </Text>
                      )}
                    </View>
                  </Callout>
                </Marker>
              </React.Fragment>
            );
          })}
        </MapView>

        {/* Map controls */}
        <View style={styles.mapControls}>
          {/* Locate me */}
          <TouchableOpacity style={styles.mapBtn} onPress={focusUser}>
            <Ionicons
              name="locate"
              size={20}
              color={userLocation ? C.primary : C.textMuted}
            />
          </TouchableOpacity>

          {/* Center on PAP */}
          <TouchableOpacity
            style={styles.mapBtn}
            onPress={() => mapRef.current?.animateToRegion(INITIAL_REGION, 400)}
          >
            <Ionicons name="home-outline" size={20} color={C.textMuted} />
          </TouchableOpacity>

          {/* City selector */}
          <TouchableOpacity style={styles.mapBtn} onPress={() => setCityPickerVisible(true)}>
            <Ionicons name="search-outline" size={20} color={C.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          {([4, 3, 2, 1] as const).map((s) => (
            <View key={s} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: SEVERITY_COLORS[s] }]} />
              <Text style={styles.legendText}>
                {s === 4 ? T('mapLegendCritical') : s === 3 ? T('mapLegendHigh') : s === 2 ? T('mapLegendMed') : T('mapLegendLow')}
              </Text>
            </View>
          ))}
        </View>

        {/* Public notice */}
        {!isLEO && (
          <View style={styles.privacyNote}>
            <Ionicons name="eye-off-outline" size={12} color={C.textMuted} />
            <Text style={styles.privacyText}>{T('mapPrivacy')}</Text>
          </View>
        )}
      </View>

      {/* Stats strip */}
      <View style={styles.statsRow}>
        <StatChip icon="warning" color={C.danger} value={active.length} label={T('mapStatActive')} />
        <StatChip
          icon="time"
          color={C.warning}
          value={alerts.filter((a) => a.status === 'pending').length}
          label={T('mapStatPending')}
        />
        <StatChip
          icon="checkmark-circle"
          color={C.success}
          value={alerts.filter((a) => a.status === 'resolved').length}
          label={T('mapStatResolved')}
        />
      </View>

      {/* Recent alerts panel */}
      <View style={styles.recentPanel}>
        <View style={styles.recentHeader}>
          <Text style={styles.recentTitle}>{T('mapRecentTitle')}</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/alerts')}>
            <Text style={styles.viewAll}>{T('mapViewAll')}</Text>
          </TouchableOpacity>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          {active.slice(0, 3).map((a) => (
            <TouchableOpacity key={a.id} onPress={() => focusAlert(a)}>
              <AlertCard alert={a} compact />
            </TouchableOpacity>
          ))}
          <View style={{ height: 90 }} />
        </ScrollView>
      </View>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/report/new')}>
        <Ionicons name="add" size={28} color="#fff" />
        <Text style={styles.fabText}>{T('mapFab')}</Text>
      </TouchableOpacity>

      <CityZonePicker
        visible={cityPickerVisible}
        onClose={() => setCityPickerVisible(false)}
        cityOnly
        onSelect={(_label, city) => {
          setCityPickerVisible(false);
          mapRef.current?.animateToRegion(
            {
              latitude: city.latitude,
              longitude: city.longitude,
              latitudeDelta: city.latitudeDelta,
              longitudeDelta: city.longitudeDelta,
            },
            600
          );
        }}
      />
    </View>
  );
}

function StatChip({
  icon,
  color,
  value,
  label,
}: {
  icon: string;
  color: string;
  value: number;
  label: string;
}) {
  const C = useTheme();
  const s = React.useMemo(() => makeStyles(C), [C]);
  return (
    <View style={[s.statChip, { borderColor: `${color}44` }]}>
      <Ionicons name={icon as any} size={16} color={color} />
      <Text style={[s.statValue, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function makeStyles(C: import('../../constants/colors').ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.black },
    criticalBanner: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: C.danger, paddingHorizontal: 16, paddingVertical: 10, zIndex: 10,
    },
    criticalText: { color: '#fff', fontWeight: '700', fontSize: 13, flex: 1 },
    mapWrapper: { height: height * 0.42, backgroundColor: C.surface },
    markerPin: {
      width: 32, height: 32, borderRadius: 16,
      alignItems: 'center', justifyContent: 'center', borderWidth: 2,
      elevation: 4, shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 3,
    },
    callout: {
      backgroundColor: C.dark, borderRadius: 12, padding: 12,
      width: 220, borderWidth: 1, borderColor: C.border,
    },
    calloutHeader: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      borderLeftWidth: 3, paddingLeft: 8, marginBottom: 4,
    },
    calloutCategory: { color: C.text, fontWeight: '700', fontSize: 13, flex: 1 },
    pendingPill: {
      backgroundColor: `${C.warning}33`, borderRadius: 6,
      paddingHorizontal: 5, paddingVertical: 2,
    },
    pendingPillText: { color: C.warning, fontSize: 9, fontWeight: '700' },
    calloutZone: { color: C.textMuted, fontSize: 11, marginBottom: 4 },
    calloutDesc: { color: C.textSecondary, fontSize: 12, lineHeight: 16, marginBottom: 8 },
    calloutFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    calloutConf: { color: C.textMuted, fontSize: 11 },
    calloutLink: { color: C.primary, fontSize: 12, fontWeight: '700' },
    calloutCoords: {
      color: C.primary, fontSize: 10, marginTop: 6,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    mapControls: { position: 'absolute', top: 12, right: 12, gap: 8 },
    mapBtn: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: C.dark, borderWidth: 1, borderColor: C.border,
      alignItems: 'center', justifyContent: 'center',
      elevation: 3, shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.3, shadowRadius: 2,
    },
    legend: {
      position: 'absolute', bottom: 10, left: 10,
      backgroundColor: C.overlay, borderRadius: 8, padding: 8, gap: 4,
    },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { color: C.textMuted, fontSize: 10 },
    privacyNote: {
      position: 'absolute', bottom: 10, right: 10,
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: C.overlay, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 4,
    },
    privacyText: { color: C.textMuted, fontSize: 9 },
    statsRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 10 },
    statChip: {
      flex: 1, backgroundColor: C.dark, borderRadius: 10,
      paddingVertical: 8, alignItems: 'center', gap: 3, borderWidth: 1,
    },
    statValue: { fontSize: 18, fontWeight: '800' },
    statLabel: { color: C.textMuted, fontSize: 10, fontWeight: '500' },
    recentPanel: { flex: 1, paddingHorizontal: 16 },
    recentHeader: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', marginBottom: 8,
    },
    recentTitle: { color: C.text, fontWeight: '700', fontSize: 15 },
    viewAll: { color: C.primary, fontSize: 13, fontWeight: '500' },
    fab: {
      position: 'absolute', bottom: 24, right: 20,
      backgroundColor: C.danger, borderRadius: 28,
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingVertical: 14, paddingHorizontal: 20,
      elevation: 8, shadowColor: C.danger,
      shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8,
    },
    fabText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  });
}
