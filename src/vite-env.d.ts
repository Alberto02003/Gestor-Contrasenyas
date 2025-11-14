/// <reference types="vite/client" />

import type { IncomingSharePayload, NetworkPeer, ShareRequestPayload } from './types/network';

interface ElectronAPI {
  platform?: string;
  isElectron?: boolean;
  setTheme?: (theme: string) => void;
  onSystemThemeChanged?: (callback: (isDark: boolean) => void) => void;
}

interface NetworkShareAPI {
  listPeers: () => Promise<NetworkPeer[]>;
  sharePassword: (payload: ShareRequestPayload) => Promise<void>;
  onPeersUpdated?: (callback: (peers: NetworkPeer[]) => void) => (() => void) | void;
  onPasswordReceived?: (callback: (payload: IncomingSharePayload) => void) => (() => void) | void;
}

declare global {
  interface Window {
    electron?: ElectronAPI;
    netShare?: NetworkShareAPI;
  }
}
