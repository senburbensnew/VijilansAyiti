import { create } from 'zustand';
import { GangMember } from '../types';
import * as gangService from '../services/appwrite/gangs';

export const CONFIRMED_THRESHOLD = 3;

interface GangStore {
  members: GangMember[];
  search: string;
  statusFilter: string | null;
  dangerFilter: number | null;
  isLoading: boolean;
  error: string | null;

  setSearch: (s: string) => void;
  setStatusFilter: (s: string | null) => void;
  setDangerFilter: (d: number | null) => void;
  getFiltered: () => GangMember[];

  fetchMembers: () => Promise<void>;
  addMember: (
    member: Omit<GangMember, 'id' | 'verificationStatus' | 'confirmations' | 'confirmedBy' | 'submittedAt'>,
  ) => Promise<void>;
  voteForMember: (memberId: string, userId: string) => Promise<void>;
}

export const useGangStore = create<GangStore>((set, get) => ({
  members:      [],
  search:       '',
  statusFilter: null,
  dangerFilter: null,
  isLoading:    false,
  error:        null,

  setSearch:       (search)       => set({ search }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setDangerFilter: (dangerFilter) => set({ dangerFilter }),

  getFiltered: () => {
    const { members, search, statusFilter, dangerFilter } = get();
    return members.filter((m) => {
      const matchesSearch =
        !search ||
        m.alias.toLowerCase().includes(search.toLowerCase()) ||
        (m.realName ?? '').toLowerCase().includes(search.toLowerCase()) ||
        m.gang.toLowerCase().includes(search.toLowerCase()) ||
        m.territory.some((t) => t.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus = !statusFilter || m.status === statusFilter;
      const matchesDanger = !dangerFilter || m.dangerLevel === dangerFilter;
      return matchesSearch && matchesStatus && matchesDanger;
    });
  },

  fetchMembers: async () => {
    set({ isLoading: true, error: null });
    try {
      const members = await gangService.fetchGangMembers();
      set({ members });
    } catch (e: unknown) {
      set({ error: (e as Error).message ?? 'Erreur de chargement' });
    } finally {
      set({ isLoading: false });
    }
  },

  addMember: async (memberData) => {
    set({ isLoading: true, error: null });
    try {
      const newMember = await gangService.createGangMember(memberData);
      set((state) => ({ members: [newMember, ...state.members] }));
    } catch (e: unknown) {
      set({ error: (e as Error).message ?? "Erreur lors de l'ajout" });
    } finally {
      set({ isLoading: false });
    }
  },

  voteForMember: async (memberId, userId) => {
    // Optimistic update
    set((state) => ({
      members: state.members.map((m) => {
        if (m.id !== memberId || m.confirmedBy.includes(userId)) return m;
        const confirmedBy = [...m.confirmedBy, userId];
        const confirmations = confirmedBy.length;
        const verificationStatus = confirmations >= CONFIRMED_THRESHOLD ? 'confirmed' : 'pending';
        return { ...m, confirmedBy, confirmations, verificationStatus };
      }),
    }));
    try {
      const updated = await gangService.voteForGangMemberRemote(memberId, userId);
      set((state) => ({
        members: state.members.map((m) => (m.id === memberId ? updated : m)),
      }));
    } catch (e: unknown) {
      // Revert optimistic update
      set((state) => ({
        members: state.members.map((m) => {
          if (m.id !== memberId) return m;
          const confirmedBy = m.confirmedBy.filter((id) => id !== userId);
          const confirmations = confirmedBy.length;
          const verificationStatus = confirmations >= CONFIRMED_THRESHOLD ? 'confirmed' : 'pending';
          return { ...m, confirmedBy, confirmations, verificationStatus };
        }),
        error: (e as Error).message ?? 'Erreur de vote',
      }));
    }
  },
}));
