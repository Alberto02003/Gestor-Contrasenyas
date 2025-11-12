import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuidv4 } from 'uuid';
import { Credential, Vault, Settings, EncryptedVault, VaultSchema, EncryptedVaultSchema } from '@/types/vault';
import { encrypt, decrypt } from '@/lib/crypto';
const VAULT_STORAGE_KEY = 'cipherkeep-vault';
type VaultStatus = 'onboarding' | 'locked' | 'unlocked' | 'loading';
type VaultState = {
  status: VaultStatus;
  vault: Vault | null;
  masterPassword: string | null;
  error: string | null;
  lastActivity: number;
};
type VaultActions = {
  initialize: () => void;
  createVault: (masterPassword: string) => Promise<void>;
  unlockVault: (masterPassword: string) => Promise<void>;
  lockVault: () => void;
  addCredential: (credential: Omit<Credential, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCredential: (credential: Credential) => Promise<void>;
  deleteCredential: (id: string) => Promise<void>;
  updateSettings: (settings: Partial<Settings>) => Promise<void>;
  updateActivity: () => void;
  _persistVault: () => Promise<void>;
};

const initialState: VaultState = {
  status: 'loading',
  vault: null,
  masterPassword: null,
  error: null,
  lastActivity: Date.now(),
};
export const useVaultStore = create<VaultState & VaultActions>()(
  immer((set, get) => ({
    ...initialState,
    initialize: () => {
      try {
        const storedVault = localStorage.getItem(VAULT_STORAGE_KEY);
        if (storedVault) {
          set({ status: 'locked' });
        } else {
          set({ status: 'onboarding' });
        }
      } catch (e) {
        console.error("Failed to initialize vault store:", e);
        set({ status: 'locked', error: 'Could not access local storage.' });
      }
    },
    createVault: async (masterPassword) => {
      set({ status: 'loading', error: null });
      try {
        const newVault: Vault = {
          credentials: [],
          settings: {
            theme: 'system',
            autoLockMinutes: 5,
            clipboardClearSeconds: 30,
          },
        };
        const encrypted = await encrypt(JSON.stringify(newVault), masterPassword);
        localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(encrypted));
        set({ status: 'unlocked', vault: newVault, masterPassword });
      } catch (error) {
        console.error('Vault creation failed:', error);
        set({ status: 'onboarding', error: 'Failed to create vault.' });
      }
    },
    unlockVault: async (masterPassword) => {
      set({ status: 'loading', error: null });
      try {
        const stored = localStorage.getItem(VAULT_STORAGE_KEY);
        if (!stored) throw new Error('No vault found.');
        const encryptedVault = EncryptedVaultSchema.parse(JSON.parse(stored));
        const decrypted = await decrypt(encryptedVault, masterPassword);
        const vault = VaultSchema.parse(JSON.parse(decrypted));
        set({ status: 'unlocked', vault, masterPassword, lastActivity: Date.now() });
      } catch (error) {
        console.error('Unlock failed:', error);
        set({ status: 'locked', error: 'Invalid password or corrupted vault.' });
      }
    },
    lockVault: () => {
      set({ status: 'locked', vault: null, masterPassword: null, error: null });
    },
    addCredential: async (credentialData) => {
      const { vault } = get();
      if (!vault) return;
      const newCredential: Credential = {
        ...credentialData,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      set((state) => {
        state.vault?.credentials.push(newCredential);
      });
      await get()._persistVault();
    },
    updateCredential: async (updatedCredential) => {
      const { vault } = get();
      if (!vault) return;
      set((state) => {
        if (!state.vault) return;
        const index = state.vault.credentials.findIndex(c => c.id === updatedCredential.id);
        if (index !== -1) {
          state.vault.credentials[index] = {
            ...updatedCredential,
            updatedAt: new Date().toISOString(),
          };
        }
      });
      await get()._persistVault();
    },
    deleteCredential: async (id) => {
      const { vault } = get();
      if (!vault) return;
      set((state) => {
        if (!state.vault) return;
        state.vault.credentials = state.vault.credentials.filter(c => c.id !== id);
      });
      await get()._persistVault();
    },
    updateSettings: async (newSettings) => {
      const { vault } = get();
      if (!vault) return;
      set((state) => {
        if (state.vault) {
          state.vault.settings = { ...state.vault.settings, ...newSettings };
        }
      });
      await get()._persistVault();
    },
    updateActivity: () => {
      set({ lastActivity: Date.now() });
    },
    _persistVault: async () => {
      const { vault, masterPassword } = get();
      if (!vault || !masterPassword) {
        console.error('Cannot persist: vault or master password not in memory.');
        get().lockVault();
        return;
      }
      try {
        const encrypted = await encrypt(JSON.stringify(vault), masterPassword);
        localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(encrypted));
      } catch (error) {
        console.error('Failed to persist vault:', error);
        set({ error: 'Failed to save changes.' });
      }
    },
  }))
);