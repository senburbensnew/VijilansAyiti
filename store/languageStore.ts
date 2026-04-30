import { create } from 'zustand';

export type Language = 'fr' | 'ht';

interface LanguageState {
  language: Language;
  setLanguage: (language: Language) => void;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: 'fr',
  setLanguage: (language) => set({ language }),
}));
