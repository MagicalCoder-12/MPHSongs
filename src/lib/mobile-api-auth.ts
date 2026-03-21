import { timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

export const MOBILE_API_SECRET_HEADER = 'x-mobile-secret';

function isMatchingSecret(providedSecret: string, expectedSecret: string) {
  const providedBuffer = Buffer.from(providedSecret, 'utf8');
  const expectedBuffer = Buffer.from(expectedSecret, 'utf8');

  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(providedBuffer, expectedBuffer);
}

export function verifyMobileApiRequest(request: NextRequest) {
  const expectedSecret = process.env.MOBILE_API_SECRET;

  if (!expectedSecret) {
    return NextResponse.json(
      {
        success: false,
        error: 'Server is missing MOBILE_API_SECRET configuration.',
      },
      { status: 500 }
    );
  }

  const providedSecret = request.headers.get(MOBILE_API_SECRET_HEADER);

  if (!providedSecret || !isMatchingSecret(providedSecret, expectedSecret)) {
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
