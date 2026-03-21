import { NextRequest, NextResponse } from 'next/server';

import { getAdminSession } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  const session = getAdminSession(request);
  const response = NextResponse.json({
    success: true,
    isAdmin: Boolean(session),
  });

  response.headers.set('Cache-Control', 'no-store');

  return response;
}
