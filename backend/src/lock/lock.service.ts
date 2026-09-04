import * as crypto from 'crypto';

export type GeneratedKeyPayload = {
  lockId: string;
  encryptedKey: string;
  nonce: string;
  authTag: string;
  salt: string;
  validFrom: Date;
  validUntil: Date;
};

export type UnlockDecision = {
  status: 'success' | 'expired' | 'revoked' | 'access_denied';
  message: string;
  unlockCount?: number;
};

export class LockService {
  generateDigitalKeyPayload(reservationId: string, lockId: string, validFrom: Date, validUntil: Date): GeneratedKeyPayload {
    const plaintextKey = crypto.randomBytes(32).toString('hex');
    const salt = crypto.randomBytes(16);
    const keyMaterial = crypto.scryptSync(`${reservationId}:${lockId}:innkeeper`, salt, 32);
    const derivedKey = new Uint8Array(keyMaterial);
    const iv = new Uint8Array(crypto.randomBytes(12));
    const plaintextBytes = new TextEncoder().encode(plaintextKey);
    const cipher = crypto.createCipheriv('aes-256-gcm', derivedKey, iv);

    const chunkOne = new Uint8Array(cipher.update(plaintextBytes));
    const chunkTwo = new Uint8Array(cipher.final());
    const ciphertextBytes = new Uint8Array(chunkOne.length + chunkTwo.length);
    ciphertextBytes.set(chunkOne, 0);
    ciphertextBytes.set(chunkTwo, chunkOne.length);

    const authTagBytes = new Uint8Array(cipher.getAuthTag());
    const encryptedBytes = new Uint8Array(iv.length + ciphertextBytes.length + authTagBytes.length);
    encryptedBytes.set(iv, 0);
    encryptedBytes.set(ciphertextBytes, iv.length);
    encryptedBytes.set(authTagBytes, iv.length + ciphertextBytes.length);

    return {
      lockId,
      encryptedKey: Buffer.from(encryptedBytes).toString('base64'),
      nonce: Buffer.from(iv).toString('base64'),
      authTag: Buffer.from(authTagBytes).toString('base64'),
      salt: salt.toString('base64'),
      validFrom,
      validUntil,
    };
  }

  async simulateUnlock(options: {
    reservationId?: string;
    reservationStatus?: string | null;
    digitalKey?: { status?: string | null; validUntil?: Date | null; reservationId?: string | null } | null;
    guestAuthorized?: boolean;
  }): Promise<UnlockDecision> {
    const { digitalKey, reservationStatus, guestAuthorized = true } = options;

    if (!digitalKey) {
      return { status: 'access_denied', message: 'Key not found.' };
    }

    if (digitalKey.status === 'REVOKED') {
      return { status: 'revoked', message: 'Key has been revoked.' };
    }

    if (digitalKey.validUntil && new Date(digitalKey.validUntil).getTime() < Date.now()) {
      return { status: 'expired', message: 'Key expired.' };
    }

    if (reservationStatus !== 'CHECKED_IN') {
      return { status: 'access_denied', message: 'Reservation is not checked in.' };
    }

    if (!guestAuthorized) {
      return { status: 'access_denied', message: 'Guest is not authorized.' };
    }

    return { status: 'success', message: 'Door unlocked successfully.' };
  }
}

export const generateDigitalKeyPayload = (reservationId: string, lockId: string) => {
  const service = new LockService();
  const validFrom = new Date();
  const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  return service.generateDigitalKeyPayload(reservationId, lockId, validFrom, validUntil);
};
