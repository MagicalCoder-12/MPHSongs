import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

const PASSWORD_KEY_LENGTH = 64;

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = scryptSync(password, salt, PASSWORD_KEY_LENGTH);

  return `${salt}:${derivedKey.toString('hex')}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, hashedPassword] = storedHash.split(':');

  if (!salt || !hashedPassword) {
    return false;
  }

  const storedBuffer = Buffer.from(hashedPassword, 'hex');
  const derivedBuffer = scryptSync(password, salt, storedBuffer.length);

  if (storedBuffer.length !== derivedBuffer.length) {
    return false;
  }

  return timingSafeEqual(storedBuffer, derivedBuffer);
}
