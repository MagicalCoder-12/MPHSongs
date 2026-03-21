import { NextRequest, NextResponse } from 'next/server';

import connectDB from '@/lib/mongodb';
import Song from '@/lib/models/Song';
import { verifyMobileApiRequest } from '@/lib/mobile-api-auth';

export async function GET(request: NextRequest) {
  const unauthorizedResponse = verifyMobileApiRequest(request);

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  try {
    await connectDB();

    const songs = await Song.find({})
      .sort({ updatedAt: -1, title: 1 })
      .select('_id title songLanguage lyrics isChoirPractice isChristmasSong createdAt updatedAt')
      .lean();

    return NextResponse.json({
      success: true,
      count: songs.length,
      songs,
    });
  } catch (error) {
    console.error('Error exporting lyrics for mobile sync:', error);

    if (error instanceof Error && error.name === 'MongoNetworkError') {
      return NextResponse.json(
        {
          success: false,
          error: 'Database connection failed. Please check your MongoDB connection.',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to export lyrics',
      },
      { status: 500 }
    );
  }
}
