import { EncryptedVault } from '@/types/vault';

const ALGO = 'AES-GCM';
const KEY_ALGO = 'PBKDF2';
const HASH = 'SHA-256';
export const PBKDF2_ITERATIONS = 600_000; // 2024 OWASP baseline
const KEY_LENGTH = 256;

const bufferToBase64 = (buffer: ArrayBuffer): string => {
  const view = new Uint8Array(buffer);
  if (typeof btoa === 'function') {
    return btoa(String.fromCharCode(...view));
  }
  const nodeBuffer = typeof globalThis !== 'undefined' ? (globalThis as any).Buffer : undefined;
  if (nodeBuffer) {
    return nodeBuffer.from(view).toString('base64');
  }
  throw new Error('No base64 encoder available in this environment.');
};

const base64ToBuffer = (base64: string): ArrayBuffer => {
  if (typeof atob === 'function') {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
  const nodeBuffer = typeof globalThis !== 'undefined' ? (globalThis as any).Buffer : undefined;
  if (nodeBuffer) {
    return Uint8Array.from(nodeBuffer.from(base64, 'base64')).buffer;
  }
  throw new Error('No base64 decoder available in this environment.');
};

/**
 * Enforces minimum entropy for the master password to prevent weak vault keys.
 * Returns an array of unmet requirements (empty when valid).
 */
export const validateMasterPassword = (password: string): string[] => {
  const errors: string[] = [];
  if (password.length < 12) errors.push('Debe tener al menos 12 caracteres');
  if (!/[a-z]/.test(password)) errors.push('Debe incluir minúsculas');
  if (!/[A-Z]/.test(password)) errors.push('Debe incluir mayúsculas');
  if (!/[0-9]/.test(password)) errors.push('Debe incluir números');
  if (!/[^A-Za-z0-9]/.test(password)) errors.push('Debe incluir un símbolo');
  return errors;
};

/** Derives a symmetric key from the master password using PBKDF2 + SHA-256. */
export const deriveKey = async (password: string, salt: Uint8Array): Promise<CryptoKey> => {
  const masterKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: KEY_ALGO },
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: KEY_ALGO,
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: HASH,
    },
    masterKey,
    { name: ALGO, length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  );
};

/**
 * Encrypts arbitrary JSON-serializable data using a fresh salt and IV.
 * Output includes salt/iv so decryption can derive the same key.
 */
export const encrypt = async (data: string, password: string): Promise<EncryptedVault> => {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const encryptedData = await crypto.subtle.encrypt(
    {
      name: ALGO,
      iv: iv,
    },
    key,
    new TextEncoder().encode(data)
  );
  return {
    salt: bufferToBase64(salt),
    iv: bufferToBase64(iv),
    encryptedData: bufferToBase64(encryptedData),
  };
};

/** Decrypts vault content with the provided master password. */
export const decrypt = async (encryptedVault: EncryptedVault, password: string): Promise<string> => {
  try {
    const salt = new Uint8Array(base64ToBuffer(encryptedVault.salt));
    const iv = base64ToBuffer(encryptedVault.iv);
    const data = base64ToBuffer(encryptedVault.encryptedData);
    const key = await deriveKey(password, salt);
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: ALGO,
        iv: iv,
      },
      key,
      data
    );
    return new TextDecoder().decode(decryptedData);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Invalid master password or corrupted vault.');
  }
};
