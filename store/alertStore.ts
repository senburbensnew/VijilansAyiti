import { create } from 'zustand';
import { Alert, AlertStatus } from '../types';
import { scheduleAlertNotification } from '../services/notifications';
import * as alertService from '../services/appwrite/alerts';
import { useNotificationStore } from './notificationStore';

interface AlertState {
  alerts: Alert[];
  selectedAlert: Alert | null;
  filter: AlertStatus | 'all';
  isLoading: boolean;
  error: string | null;

  setFilter: (f: AlertStatus | 'all') => void;
  setSelectedAlert: (a: Alert | null) => void;

  fetchAlerts: () => Promise<void>;
  addAlert: (data: Omit<Alert, 'id'>) => Promise<void>;
  confirmAlert: (id: string, userId?: string, deviceId?: string) => Promise<void>;
  disputeAlert: (id: string, userId?: string, reason?: string) => Promise<void>;

  getActiveAlerts: () => Alert[];
  getPendingAlerts: () => Alert[];
}

export const useAlertStore = create<AlertState>((set, get) => ({
  alerts:        [],
  selectedAlert: null,
  filter:        'all',
  isLoading:     false,
  error:         null,

  setFilter:        (filter)        => set({ filter }),
  setSelectedAlert: (selectedAlert) => set({ selectedAlert }),

  fetchAlerts: async () => {
    set({ isLoading: true, error: null });
    try {
      const alerts = await alertService.fetchAlerts();
      set({ alerts });
    } catch (e: unknown) {
      set({ error: (e as Error).message ?? 'Erreur de chargement' });
    } finally {
      set({ isLoading: false });
    }
  },

  addAlert: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const alert = await alertService.createAlert(data);
      set((state) => ({ alerts: [alert, ...state.alerts] }));
    } catch (e: unknown) {
      set({ error: (e as Error).message ?? 'Erreur lors du signalement' });
    } finally {
      set({ isLoading: false });
    }
  },

  confirmAlert: async (id, userId, deviceId) => {
    // Optimistic update
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === id ? { ...a, confirmations: a.confirmations + 1 } : a,
      ),
    }));
    try {
      const updated = await alertService.confirmAlertRemote(id, userId, deviceId);
      // Sync with server truth
      set((state) => ({
        alerts: state.alerts.map((a) => (a.id === id ? updated : a)),
      }));
      // Notify if newly published
      if (updated.status === 'active' && updated.publishedAt) {
        const { shouldNotify } = useNotificationStore.getState();
        if (shouldNotify(updated.severity, updated.zone)) {
          scheduleAlertNotification(updated).catch(() => {});
        }
      }
    } catch (e: unknown) {
      // Revert optimistic update
      set((state) => ({
        alerts: state.alerts.map((a) =>
          a.id === id ? { ...a, confirmations: a.confirmations - 1 } : a,
        ),
        error: (e as Error).message ?? 'Erreur de confirmation',
      }));
    }
  },

  disputeAlert: async (id, userId, reason) => {
    // Optimistic update
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === id ? { ...a, disputeCount: a.disputeCount + 1 } : a,
      ),
    }));
    try {
      const updated = await alertService.disputeAlertRemote(id, userId, reason);
      set((state) => ({
        alerts: state.alerts.map((a) => (a.id === id ? updated : a)),
      }));
    } catch (e: unknown) {
      // Revert optimistic update
      set((state) => ({
        alerts: state.alerts.map((a) =>
          a.id === id ? { ...a, disputeCount: a.disputeCount - 1 } : a,
        ),
        error: (e as Error).message ?? 'Erreur de contestation',
      }));
    }
  },

  getActiveAlerts:  () => get().alerts.filter((a) => a.status === 'active'),
  getPendingAlerts: () => get().alerts.filter((a) => a.status === 'pending'),
}));
