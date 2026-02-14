import { create } from 'zustand';

interface AppState {
  sidebarOpen: boolean;
  activeCampaignRole: 'DM' | 'PLAYER' | null;
  
  // UI Preferences (persisted in localStorage)
  reducedMotion: boolean;
  compactMode: boolean;

  // Actions
  toggleSidebar: () => void;
  setActiveCampaignRole: (role: 'DM' | 'PLAYER' | null) => void;
  setReducedMotion: (v: boolean) => void;
  setCompactMode: (v: boolean) => void;
}

// Read initial preferences from localStorage safely
function getStoredPreference(key: string, fallback: boolean): boolean {
  if (typeof window === 'undefined') return fallback;
  try {
    const val = localStorage.getItem(`taverna_${key}`);
    return val !== null ? val === 'true' : fallback;
  } catch { return fallback; }
}

function storePreference(key: string, value: boolean) {
  try { localStorage.setItem(`taverna_${key}`, String(value)); } catch {}
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: typeof window !== 'undefined' && window.innerWidth >= 768,
  activeCampaignRole: null,
  reducedMotion: getStoredPreference('reducedMotion', false),
  compactMode: getStoredPreference('compactMode', false),

  toggleSidebar: () => {
    set((s) => ({ sidebarOpen: !s.sidebarOpen }));
  },

  setActiveCampaignRole: (role) => {
    set({ activeCampaignRole: role });
  },

  setReducedMotion: (v) => {
    storePreference('reducedMotion', v);
    set({ reducedMotion: v });
  },

  setCompactMode: (v) => {
    storePreference('compactMode', v);
    set({ compactMode: v });
  },
}));
