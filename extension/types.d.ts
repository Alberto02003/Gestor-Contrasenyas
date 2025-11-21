// TypeScript definitions para la extensión

// Window API extendida con electronAPI
declare global {
  interface Window {
    electronAPI?: {
      // API existente de tu app
      getSystemTheme?: () => 'light' | 'dark';
      onThemeChange?: (callback: (theme: 'light' | 'dark') => void) => void;

      // Nueva API para extensión
      send: (channel: string, data: unknown) => void;
      on?: (channel: string, callback: (...args: unknown[]) => void) => void;
      removeListener?: (channel: string, callback: (...args: unknown[]) => void) => void;
    };
  }
}

// Mensajes de Native Messaging
export interface NativeMessage {
  messageId?: string;
  action: string;
  [key: string]: unknown;
}

export interface NativeResponse {
  messageId?: string;
  error?: string;
  [key: string]: unknown;
}

// Mensajes específicos
export interface GetVaultStatusMessage extends NativeMessage {
  action: 'getVaultStatus';
}

export interface GetVaultStatusResponse extends NativeResponse {
  isUnlocked: boolean;
}

export interface GetCredentialsMessage extends NativeMessage {
  action: 'getCredentials';
  url: string;
}

export interface SearchCredentialsMessage extends NativeMessage {
  action: 'searchCredentials';
  query: string;
}

export interface CredentialsResponse extends NativeResponse {
  credentials: Credential[];
}

export interface UnlockVaultMessage extends NativeMessage {
  action: 'unlockVault';
  password: string;
}

export interface UnlockVaultResponse extends NativeResponse {
  success: boolean;
}

// Tipos de credenciales
export interface Credential {
  id: string;
  title: string;
  username: string;
  password: string;
  url?: string;
  notes?: string;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
}

// Estado de la vault
export interface VaultState {
  isUnlocked: boolean;
  credentials: Credential[];
}

// Mensajes de Chrome Extension
export interface ChromeMessage {
  type: string;
  [key: string]: unknown;
}

export interface ConnectNativeMessage extends ChromeMessage {
  type: 'CONNECT_NATIVE';
}

export interface GetCredentialsMessage extends ChromeMessage {
  type: 'GET_CREDENTIALS';
  url: string;
}

export interface SearchCredentialsExtMessage extends ChromeMessage {
  type: 'SEARCH_CREDENTIALS';
  query: string;
}

export interface AutofillCredentialMessage extends ChromeMessage {
  type: 'AUTOFILL_CREDENTIAL';
  credential: Credential;
}

export interface GetVaultStatusExtMessage extends ChromeMessage {
  type: 'GET_VAULT_STATUS';
}

export interface NativeMessageWrapper extends ChromeMessage {
  type: 'NATIVE_MESSAGE';
  data: NativeMessage;
}

export interface FillFormMessage extends ChromeMessage {
  type: 'FILL_FORM';
  credential: Credential;
}

export interface UrlChangedMessage extends ChromeMessage {
  type: 'URL_CHANGED';
  url: string;
}

// Chrome API Response
export interface ChromeResponse {
  success?: boolean;
  error?: string;
  [key: string]: unknown;
}

// Content Script - Detected Form
export interface DetectedForm {
  form: HTMLFormElement;
  usernameField: HTMLInputElement | null;
  passwordField: HTMLInputElement;
  index: number;
}

export {};
