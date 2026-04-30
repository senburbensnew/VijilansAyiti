import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useAlertStore } from '../../store/alertStore';
import { useAuthStore } from '../../store/authStore';
import { useLanguageStore } from '../../store/languageStore';
import { useTranslation } from '../../hooks/useTranslation';

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

function LangButton() {
  const C = useTheme();
  const { language, setLanguage } = useLanguageStore();
  return (
    <TouchableOpacity
      style={[styles.langBtn, { borderColor: C.border, backgroundColor: C.surface }]}
      onPress={() => setLanguage(language === 'fr' ? 'ht' : 'fr')}
      activeOpacity={0.7}
    >
      <Text style={[styles.langBtnText, { color: C.text }]}>
        {language === 'fr' ? '🇫🇷 FR' : '🇭🇹 KR'}
      </Text>
    </TouchableOpacity>
  );
}

export default function TabsLayout() {
  const { user } = useAuthStore();
  const C = useTheme();
  const T = useTranslation();

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
          title: T('tabMap'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map" size={size} color={color} />
          ),
          headerTitle: 'VijilansAyiti',
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginRight: 4 }}>
              <LangButton />
              <View style={{ marginRight: 8 }}>
                <AlertsBadge />
              </View>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: T('tabAlerts'),
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
          title: T('tabGangs'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="skull" size={size} color={color} />
          ),
          headerTitle: T('headerGangs'),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: T('tabProfile'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle" size={size} color={color} />
          ),
          headerRight: () => <LangButton />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  langBtn: {
    marginRight: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
  },
  langBtnText: { fontSize: 12, fontWeight: '700' },
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
