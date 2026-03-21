import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

import connectDB from '@/lib/mongodb';
import AdminUser from '@/lib/models/AdminUser';
import { hashPassword, verifyPassword } from '@/lib/password';

const ADMIN_SESSION_COOKIE = 'mph_admin_session';
const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

function getAdminEnvConfig() {
  const username = process.env.ADMIN_USERNAME?.trim();
  const password = process.env.ADMIN_PASSWORD;
  const sessionSecret = process.env.ADMIN_SESSION_SECRET;

  return { username, password, sessionSecret };
}

function signSessionPayload(payload: string, secret: string) {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

function buildSessionToken(username: string, sessionSecret: string) {
  const expiresAt = Date.now() + ADMIN_SESSION_MAX_AGE_SECONDS * 1000;
  const payload = `${username}:${expiresAt}`;
  const signature = signSessionPayload(payload, sessionSecret);

  return Buffer.from(`${payload}:${signature}`, 'utf8').toString('base64url');
}

function parseSessionToken(token: string, sessionSecret: string) {
  try {
    const decodedToken = Buffer.from(token, 'base64url').toString('utf8');
    const [username, expiresAtValue, signature] = decodedToken.split(':');

    if (!username || !expiresAtValue || !signature) {
      return null;
    }

    const payload = `${username}:${expiresAtValue}`;
    const expectedSignature = signSessionPayload(payload, sessionSecret);
    const providedSignatureBuffer = Buffer.from(signature, 'hex');
    const expectedSignatureBuffer = Buffer.from(expectedSignature, 'hex');

    if (providedSignatureBuffer.length !== expectedSignatureBuffer.length) {
      return null;
    }

    if (!timingSafeEqual(providedSignatureBuffer, expectedSignatureBuffer)) {
      return null;
    }

    const expiresAt = Number(expiresAtValue);

    if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) {
      return null;
    }

    return { username };
  } catch {
    return null;
  }
}

export async function ensureAdminUserSeeded() {
  const { username, password } = getAdminEnvConfig();

  if (!username || !password) {
    return {
      success: false as const,
      error: 'Missing ADMIN_USERNAME or ADMIN_PASSWORD configuration.',
    };
  }

  await connectDB();

  const existingAdmin = await AdminUser.findOne({ username });

  if (!existingAdmin) {
    await AdminUser.create({
      username,
      passwordHash: hashPassword(password),
    });

    return { success: true as const, username };
  }

  if (!verifyPassword(password, existingAdmin.passwordHash)) {
    existingAdmin.passwordHash = hashPassword(password);
    await existingAdmin.save();
  }

  return { success: true as const, username };
}

export async function verifyAdminCredentials(username: string, password: string) {
  const seedResult = await ensureAdminUserSeeded();

  if (!seedResult.success) {
    return seedResult;
  }

  const adminUser = await AdminUser.findOne({ username: username.trim() });

  if (!adminUser || !verifyPassword(password, adminUser.passwordHash)) {
    return {
      success: false as const,
      error: 'Invalid credentials',
    };
  }

  return {
    success: true as const,
    username: adminUser.username,
  };
}

export function createAdminLoginResponse(username: string) {
  const { sessionSecret } = getAdminEnvConfig();

  if (!sessionSecret) {
    return NextResponse.json(
      {
        success: false,
        error: 'Missing ADMIN_SESSION_SECRET configuration.',
      },
      { status: 500 }
    );
  }

  const response = NextResponse.json({
    success: true,
    username,
  });

  response.headers.set('Cache-Control', 'no-store');

  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: buildSessionToken(username, sessionSecret),
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
    path: '/',
  });

  return response;
}

export function createAdminLogoutResponse() {
  const response = NextResponse.json({ success: true });

  response.headers.set('Cache-Control', 'no-store');

  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: '',
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(0),
    path: '/',
  });

  return response;
}

export function getAdminSession(request: NextRequest) {
  const { username, sessionSecret } = getAdminEnvConfig();
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;

  if (!username || !sessionSecret || !token) {
    return null;
  }

  const parsedToken = parseSessionToken(token, sessionSecret);

  if (!parsedToken || parsedToken.username !== username) {
    return null;
  }

  return parsedToken;
}

export function requireAdmin(request: NextRequest) {
  const session = getAdminSession(request);

  if (!session) {
    return NextResponse.json(
      {
        success: false,
        error: 'Unauthorized',
      },
      { status: 401 }
    );
  }

  return null;
}
