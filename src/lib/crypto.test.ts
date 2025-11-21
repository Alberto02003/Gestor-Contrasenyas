import { describe, expect, it } from 'vitest';

import { decrypt, encrypt, PBKDF2_ITERATIONS, validateMasterPassword } from './crypto';

const strongPassword = 'FuertePassw0rd!';

describe('crypto', () => {
  it('encrypts and decrypts roundtrip content', async () => {
    const secret = JSON.stringify({ hello: 'world', nested: { ok: true } });
    const encrypted = await encrypt(secret, strongPassword);
    const decrypted = await decrypt(encrypted, strongPassword);
    expect(decrypted).toBe(secret);
  });

  it('rejects decryption with the wrong master password', async () => {
    const encrypted = await encrypt('top-secret', strongPassword);
    await expect(decrypt(encrypted, 'WrongPass123!')).rejects.toThrow();
  });

  it('uses hardened PBKDF2 iteration count', () => {
    expect(PBKDF2_ITERATIONS).toBeGreaterThanOrEqual(600_000);
  });

  it('flags weak master passwords', () => {
    const errors = validateMasterPassword('weakpass');
    expect(errors.length).toBeGreaterThan(0);
  });
});
