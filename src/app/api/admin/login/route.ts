import { NextRequest, NextResponse } from 'next/server';

import { createAdminLoginResponse, verifyAdminCredentials } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const username = typeof body?.username === 'string' ? body.username.trim() : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!username || !password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Username and password are required',
        },
        { status: 400 }
      );
    }

    const result = await verifyAdminCredentials(username, password);

    if (!result.success) {
      const status = result.error === 'Invalid credentials' ? 401 : 500;

      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status }
      );
    }

    return createAdminLoginResponse(result.username);
  } catch (error) {
    console.error('Error logging in admin:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to log in',
      },
      { status: 500 }
    );
  }
}
