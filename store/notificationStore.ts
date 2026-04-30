import { create } from 'zustand';
import {
  registerForPushNotificationsAsync,
  scheduleTestNotification,
} from '../services/notifications';

interface NotificationState {
  permissionGranted: boolean;
  pushToken: string | null;
  enabled: boolean;
  criticalOnly: boolean;
  watchedCity: string | null;

  initialize: () => Promise<void>;
  setEnabled: (v: boolean) => Promise<void>;
  setCriticalOnly: (v: boolean) => void;
  setWatchedCity: (city: string | null) => void;
  shouldNotify: (severity: number, zone: string) => boolean;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  permissionGranted: false,
  pushToken: null,
  enabled: false,
  criticalOnly: false,
  watchedCity: null,

  initialize: async () => {
    const { permissionGranted, pushToken } = await registerForPushNotificationsAsync();
    set({ permissionGranted, pushToken, enabled: permissionGranted });
  },

  setEnabled: async (enabled) => {
    if (enabled && !get().permissionGranted) {
      const { permissionGranted, pushToken } = await registerForPushNotificationsAsync();
      set({ permissionGranted, pushToken, enabled: permissionGranted });
      if (permissionGranted) {
        await scheduleTestNotification();
      }
    } else {
      set({ enabled });
    }
  },

  setCriticalOnly: (criticalOnly) => set({ criticalOnly }),

  setWatchedCity: (watchedCity) => set({ watchedCity }),

  shouldNotify: (severity, zone) => {
    const { enabled, criticalOnly, watchedCity } = get();
    if (!enabled) return false;
    if (criticalOnly && severity < 4) return false;
    if (watchedCity && !zone.toLowerCase().includes(watchedCity.toLowerCase())) return false;
    return true;
  },
}));
