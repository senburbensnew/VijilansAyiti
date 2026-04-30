import { create } from 'zustand';
import { User } from '../types';
import * as authService from '../services/appwrite/auth';

export type OtpMethod = 'sms' | 'email';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  pendingPhone: string;
  pendingEmail: string;
  otpMethod: OtpMethod;
  /** Appwrite userId returned by createPhoneToken / createEmailToken */
  pendingUserId: string;

  // Setters (used by UI before calling sendOtp)
  setPendingPhone: (phone: string) => void;
  setPendingEmail: (email: string) => void;
  setOtpMethod: (method: OtpMethod) => void;

  // Async actions
  sendOtp: () => Promise<void>;
  verifyOtp: (otp: string) => Promise<void>;
  loadCurrentUser: () => Promise<void>;
  updatePseudo: (pseudo: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user:            null,
  isAuthenticated: false,
  isLoading:       false,
  error:           null,
  pendingPhone:    '',
  pendingEmail:    '',
  otpMethod:       'sms',
  pendingUserId:   '',

  setPendingPhone: (pendingPhone) => set({ pendingPhone }),
  setPendingEmail: (pendingEmail) => set({ pendingEmail }),
  setOtpMethod:    (otpMethod)    => set({ otpMethod }),

  sendOtp: async () => {
    set({ isLoading: true, error: null });
    try {
      const { otpMethod, pendingPhone, pendingEmail } = get();
      const userId = otpMethod === 'sms'
        ? await authService.sendPhoneOtp(pendingPhone)
        : await authService.sendEmailOtp(pendingEmail);
      set({ pendingUserId: userId });
    } catch (e: unknown) {
      set({ error: (e as Error).message ?? 'Erreur lors de l\'envoi du code' });
    } finally {
      set({ isLoading: false });
    }
  },

  verifyOtp: async (otp) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authService.verifyOtp(get().pendingUserId, otp);
      set({ user, isAuthenticated: true });
    } catch (e: unknown) {
      set({ error: (e as Error).message ?? 'Code incorrect' });
    } finally {
      set({ isLoading: false });
    }
  },

  loadCurrentUser: async () => {
    set({ isLoading: true, error: null });
    try {
      const user = await authService.getCurrentUser();
      set({ user, isAuthenticated: true });
    } catch {
      // No active session — user needs to log in
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },

  updatePseudo: async (pseudo) => {
    const { user } = get();
    if (!user) return;
    set({ isLoading: true, error: null });
    try {
      await authService.updatePseudo(user.id, pseudo);
      set({ user: { ...user, pseudo, displayName: pseudo } });
    } catch (e: unknown) {
      set({ error: (e as Error).message ?? 'Erreur lors de la mise à jour du pseudo' });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      await authService.logout();
    } catch { /* ignore */ } finally {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
