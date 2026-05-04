import { useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../hooks/useTheme';
import { useNotificationStore } from '../store/notificationStore';
import { useAuthStore } from '../store/authStore';
import {
  addNotificationResponseListener,
  addForegroundNotificationListener,
} from '../services/notifications';
import type * as Notifications from 'expo-notifications';

export default function RootLayout() {
  const C = useTheme();
  const { initialize } = useNotificationStore();
  const { loadCurrentUser } = useAuthStore();
  const responseListenerRef = useRef<Notifications.EventSubscription | null>(null);
  const foregroundListenerRef = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    initialize();
    loadCurrentUser();

    // Navigate to alert detail when user taps a notification
    responseListenerRef.current = addNotificationResponseListener((alertId) => {
      router.push(`/report/${alertId}`);
    });

    // Optional: handle foreground notifications (they already show via setNotificationHandler)
    foregroundListenerRef.current = addForegroundNotificationListener(
      (_notification: Notifications.Notification) => {
        // Notification is already displayed by the system handler
      }
    );

    return () => {
      responseListenerRef.current?.remove();
      foregroundListenerRef.current?.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style={C.isDark ? 'light' : 'dark'} backgroundColor={C.black} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: C.black },
          headerTintColor: C.text,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: C.black },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="report/new"
          options={{ title: 'Nouveau Signalement', presentation: 'modal' }}
        />
        <Stack.Screen
          name="report/[id]"
          options={{ title: 'Détail Alerte' }}
        />
        <Stack.Screen
          name="moderator/index"
          options={{ title: 'Espace Modérateur' }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
