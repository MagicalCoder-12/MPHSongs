import { NextRequest, NextResponse } from 'next/server';

import connectDB from '@/lib/mongodb';
import Song from '@/lib/models/Song';
import { verifyMobileApiRequest } from '@/lib/mobile-api-auth';
import { GOOD_FRIDAY_TAG } from '@/lib/song-tags';

export async function GET(request: NextRequest) {
  const unauthorizedResponse = verifyMobileApiRequest(request);

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  try {
    await connectDB();

    const songs = await Song.find({})
      .sort({ updatedAt: -1, title: 1 })
      .select('_id title songLanguage lyrics isChoirPractice isChristmasSong tags createdAt updatedAt')
      .lean();

    const choirSongs = songs.filter((song) => song.isChoirPractice);
    const goodFridaySongs = songs.filter((song) => song.tags?.includes(GOOD_FRIDAY_TAG));

    return NextResponse.json({
      success: true,
      count: songs.length,
      counts: {
        songs: songs.length,
        choirSongs: choirSongs.length,
        goodFridaySongs: goodFridaySongs.length,
      },
      songs,
      choirSongs,
      goodFridaySongs,
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
