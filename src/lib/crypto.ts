import { EncryptedVault } from '@/types/vault';
const ALGO = 'AES-GCM';
const KEY_ALGO = 'PBKDF2';
const HASH = 'SHA-256';
const ITERATIONS = 250000;
const KEY_LENGTH = 256;
// Helper to convert ArrayBuffer to Base64 string
const bufferToBase64 = (buffer: ArrayBuffer): string => {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
};
// Helper to convert Base64 string to ArrayBuffer
const base64ToBuffer = (base64: string): ArrayBuffer => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};
// Derives a key from a master password using PBKDF2
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
      iterations: ITERATIONS,
      hash: HASH,
    },
    masterKey,
    { name: ALGO, length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  );
};
// Encrypts data with a derived key
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
// Decrypts data with a derived key
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