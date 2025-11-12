import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
export const CredentialSchema = z.object({
  id: z.string().uuid().default(() => uuidv4()),
  title: z.string().min(1, 'Title is required'),
  url: z.string().optional(),
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  createdAt: z.string().datetime().default(() => new Date().toISOString()),
  updatedAt: z.string().datetime().default(() => new Date().toISOString()),
  lastUsedAt: z.string().datetime().optional(),
});
export type Credential = z.infer<typeof CredentialSchema>;
export type NewCredential = z.input<typeof CredentialSchema>;
export const SettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  autoLockMinutes: z.number().min(0).default(5), // 0 means never
  clipboardClearSeconds: z.number().min(0).default(30), // 0 means never
});
export type Settings = z.infer<typeof SettingsSchema>;
export const VaultSchema = z.object({
  credentials: z.array(CredentialSchema),
  settings: SettingsSchema,
});
export type Vault = z.infer<typeof VaultSchema>;
export const EncryptedVaultSchema = z.object({
  iv: z.string(),
  salt: z.string(),
  encryptedData: z.string(),
});
export type EncryptedVault = z.infer<typeof EncryptedVaultSchema>;