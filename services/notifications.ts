import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { Alert as AppAlert } from '../types';
import { ALERT_CATEGORIES } from '../constants/config';

// Show notifications even when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const CHANNEL_ALERTS = 'vijilans-alerts';
const CHANNEL_CRITICAL = 'vijilans-critical';

async function ensureAndroidChannels() {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(CHANNEL_ALERTS, {
    name: 'Alertes',
    description: 'Nouvelles alertes confirmées dans votre zone',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#003087',
    sound: 'default',
    enableVibrate: true,
  });

  await Notifications.setNotificationChannelAsync(CHANNEL_CRITICAL, {
    name: 'Alertes Critiques',
    description: 'Alertes de niveau critique (kidnapping, fusillade…)',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 500, 250, 500, 250, 500],
    lightColor: '#FF0000',
    sound: 'default',
    enableVibrate: true,
    bypassDnd: true,
  });
}

export async function registerForPushNotificationsAsync(): Promise<{
  permissionGranted: boolean;
  pushToken: string | null;
}> {
  await ensureAndroidChannels();

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return { permissionGranted: false, pushToken: null };
  }

  let pushToken: string | null = null;
  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;
    if (projectId) {
      const result = await Notifications.getExpoPushTokenAsync({ projectId });
      pushToken = result.data;
    }
  } catch {
    // Simulator / no EAS config — local notifications still work
  }

  return { permissionGranted: true, pushToken };
}

const CATEGORY_EMOJI: Record<string, string> = {
  vol: '💰',
  agression: '✊',
  kidnapping: '🚨',
  fusillade: '🔫',
  barricade: '🚧',
  manifestation_violente: '🔥',
  meurtre: '💀',
  trafic_organe: '🫀',
  autre: '⚠️',
};

export async function scheduleAlertNotification(alert: AppAlert): Promise<void> {
  const cat = ALERT_CATEGORIES[alert.category];
  const emoji = CATEGORY_EMOJI[alert.category] ?? '⚠️';
  const isCritical = alert.severity === 4;
  const channelId = isCritical ? CHANNEL_CRITICAL : CHANNEL_ALERTS;

  const title = isCritical
    ? `🚨 ALERTE CRITIQUE — ${cat.label}`
    : `${emoji} ${cat.label} confirmée`;

  const body = `${alert.zone}\n${alert.description.slice(0, 100)}${alert.description.length > 100 ? '…' : ''}`;

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { alertId: alert.id },
      sound: 'default',
      ...(Platform.OS === 'android' && { channelId }),
    },
    trigger: null,
  });
}

export async function scheduleTestNotification(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '✅ Notifications activées',
      body: 'VijilansAyiti vous alertera des incidents dans votre zone.',
      sound: 'default',
      ...(Platform.OS === 'android' && { channelId: CHANNEL_ALERTS }),
    },
    trigger: null,
  });
}

export function addNotificationResponseListener(
  handler: (alertId: string) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const alertId = response.notification.request.content.data?.alertId as
      | string
      | undefined;
    if (alertId) handler(alertId);
  });
}

export function addForegroundNotificationListener(
  handler: (notification: Notifications.Notification) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationReceivedListener(handler);
}
