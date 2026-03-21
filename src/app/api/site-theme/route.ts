import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin-auth';
import connectDB from '@/lib/mongodb';
import SiteSettings from '@/lib/models/SiteSettings';
import { isValidSiteTheme } from '@/lib/site-theme';

const GLOBAL_SETTINGS_KEY = 'global';

export async function GET() {
  try {
    await connectDB();

    const settings = await SiteSettings.findOne({ singletonKey: GLOBAL_SETTINGS_KEY })
      .select('siteTheme')
      .lean();

    return NextResponse.json({
      success: true,
      siteTheme: settings?.siteTheme ?? 'normal',
    });
  } catch (error) {
    console.error('Error fetching site theme:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch site theme',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const unauthorizedResponse = requireAdmin(request);

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  try {
    const body = await request.json();
    const siteTheme = body?.siteTheme;

    if (!isValidSiteTheme(siteTheme)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid site theme',
        },
        { status: 400 }
      );
    }

    await connectDB();

    const settings = await SiteSettings.findOneAndUpdate(
      { singletonKey: GLOBAL_SETTINGS_KEY },
      { siteTheme },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).lean();

    return NextResponse.json({
      success: true,
      siteTheme: settings.siteTheme,
    });
  } catch (error) {
    console.error('Error updating site theme:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update site theme',
      },
      { status: 500 }
    );
  }
}
