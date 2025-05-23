import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { db } from './db';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
const AUTH_COOKIE = 'auth-token';

// Проверяем режим разработки
const isDevelopmentMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

export async function createToken(userId: string) {
  // В режиме разработки создаем токен с админскими правами
  if (isDevelopmentMode) {
    console.log('⚠️ Creating development mode token with admin rights');
    const token = await new SignJWT({ userId: 'dev-user', isAdmin: true })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(JWT_SECRET);

    cookies().set(AUTH_COOKIE, token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return token;
  }

  // Get user data including admin status
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) throw new Error('User not found');

  const token = await new SignJWT({ userId, isAdmin: user.isAdmin })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(JWT_SECRET);

  cookies().set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return token;
}

export async function verifyAuth() {
  if (isDevelopmentMode) {
    console.log('⚠️ Development mode - returning admin user ID');
    return 'dev-user';
  }

  const token = cookies().get(AUTH_COOKIE)?.value;
  if (!token) return null;

  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload.userId as string;
  } catch {
    return null;
  }
}

export async function verifyAdmin() {
  if (isDevelopmentMode) {
    console.log('⚠️ Development mode - admin status is true');
    return true;
  }

  const token = cookies().get(AUTH_COOKIE)?.value;
  if (!token) return false;

  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return Boolean(verified.payload.isAdmin);
  } catch {
    return false;
  }
}

export async function removeAuth() {
  cookies().delete(AUTH_COOKIE);
}
