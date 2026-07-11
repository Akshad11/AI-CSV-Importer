import { create } from 'zustand';
import { SystemSettings } from '../types';

interface SettingsState {
  settings: Omit<SystemSettings, 'theme'>;
  availableProviders: {
    openai: boolean;
    gemini: boolean;
    ollama: boolean;
    mock: boolean;
  };
  updateSettings: (newSettings: Partial<Omit<SystemSettings, 'theme'>>) => void;
  resetSettings: () => void;
  setAvailableProviders: (providers: {
    openai: boolean;
    gemini: boolean;
    ollama: boolean;
    mock: boolean;
  }) => void;
}

const defaultSettings: Omit<SystemSettings, 'theme'> = {
  confidenceThreshold: 85,
  defaultLeadSource: 'Organic Search',
  rowsPerPage: 10,
  animationSpeed: 'normal',
  defaultPreviewRows: 50,
  aiProvider: 'openai',
};

const defaultProviders = {
  openai: false,
  gemini: false,
  ollama: false,
  mock: true,
};

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: defaultSettings,
  availableProviders: defaultProviders,
  updateSettings: (newSettings) =>
    set((state) => ({ settings: { ...state.settings, ...newSettings } })),
  resetSettings: () => set({ settings: defaultSettings }),
  setAvailableProviders: (providers) => set({ availableProviders: providers }),
}));
