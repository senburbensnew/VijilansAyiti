import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useAlertStore } from '../../store/alertStore';
import { useAuthStore } from '../../store/authStore';

function AlertsBadge() {
  const active = useAlertStore((s) => s.alerts.filter((a) => a.status === 'active').length);
  const C = useTheme();
  if (!active) return null;
  return (
    <View style={[styles.badge, { backgroundColor: C.danger }]}>
      <Text style={styles.badgeText}>{active > 9 ? '9+' : active}</Text>
    </View>
  );
}

export default function TabsLayout() {
  const { user } = useAuthStore();
  const C = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: C.black },
        headerTintColor: C.text,
        headerTitleStyle: { fontWeight: '700', fontSize: 18 },
        tabBarStyle: {
          backgroundColor: C.dark,
          borderTopColor: C.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: C.danger,
        tabBarInactiveTintColor: C.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Carte',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map" size={size} color={color} />
          ),
          headerTitle: 'VijilansAyiti',
          headerRight: () => (
            <View style={{ marginRight: 16 }}>
              <AlertsBadge />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alertes',
          tabBarIcon: ({ color, size }) => (
            <View>
              <Ionicons name="warning" size={size} color={color} />
              <AlertsBadge />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="gangs"
        options={{
          title: 'Bandits',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="skull" size={size} color={color} />
          ),
          headerTitle: 'Membres de gangs',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});
