import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Song from '@/lib/models/Song';

/**
 * Desktop-only delete endpoint.
 * Secured by DESKTOP_SECRET env var — the desktop app sends it as X-Desktop-Secret header.
 * Only deletes songs where source === 'desktop' (or no source), to prevent wiping web songs.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.DESKTOP_SECRET;
  if (!secret) {
    return NextResponse.json(
      { success: false, error: 'Server not configured' },
      { status: 503 }
    );
  }

  const provided = request.headers.get('x-desktop-secret');
  if (!provided || provided !== secret) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    await connectDB();
    const { id } = await request.json();

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing song id' },
        { status: 400 }
      );
    }

    // Only delete desktop-originated songs to protect web songs
    const deleted = await Song.findOneAndDelete({ _id: id, source: 'desktop' });

    if (!deleted) {
      // Check if song exists but is web-owned
      const song = await Song.findById(id).lean();
      if (song) {
        return NextResponse.json(
          { success: false, error: 'Cannot delete web-owned song from desktop' },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { success: false, error: 'Song not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Song deleted' });
  } catch (error) {
    console.error('Desktop delete error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete song' },
      { status: 500 }
    );
  }
}
