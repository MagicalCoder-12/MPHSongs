import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import connectDB from '@/lib/mongodb';
import Song from '@/lib/models/Song';
import { parseSongPayload } from '@/lib/song-validation';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    
    const song = await Song.findById(id);
    
    if (!song) {
      return NextResponse.json(
        { success: false, error: 'Song not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: song });
  } catch (error) {
    console.error('Error fetching song:', error);
    
    // Handle MongoDB connection errors specifically
    if (error instanceof Error && error.name === 'MongoNetworkError') {
      return NextResponse.json(
        { success: false, error: 'Database connection failed. Please check your MongoDB connection.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch song' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    
    const body = await request.json();
    const parsedPayload = parseSongPayload(body);

    if (!parsedPayload.success) {
      return NextResponse.json(
        { success: false, error: parsedPayload.error },
        { status: 400 }
      );
    }

    const { title, subtitle, songLanguage, lyrics, isChoirPractice, isChristmasSong, tags } = parsedPayload.data;
    const extraOwner = (parsedPayload.data as any).owner;
    const extraSource = (parsedPayload.data as any).source;
    const extraDesktop = (parsedPayload.data as any).desktop;
    const expectedUpdatedAt = (parsedPayload.data as any).expectedUpdatedAt as string | undefined;

    // Conflict detection: if client sent expectedUpdatedAt, check against DB current updatedAt
    const existingForConflict = await Song.findById(id);
    if (existingForConflict && expectedUpdatedAt) {
      const expectedDate = new Date(expectedUpdatedAt);
      const serverDate = new Date((existingForConflict as any).updatedAt);
      if (!isNaN(expectedDate.getTime()) && !isNaN(serverDate.getTime()) && Math.abs(serverDate.getTime() - expectedDate.getTime()) > 1000 && serverDate > expectedDate) {
        return NextResponse.json(
          { success: false, error: 'Conflict: server version is newer', serverSong: existingForConflict },
          { status: 409 }
        );
      }
    }

    const updateFields: Record<string, unknown> = {
      title,
      songLanguage,
      lyrics,
      isChoirPractice,
      isChristmasSong,
      tags,
    };

    if (subtitle !== undefined) {
      updateFields.subtitle = subtitle;
    } else {
      updateFields.subtitle = null;
    }
    if (extraOwner === 'app' || extraOwner === 'web') (updateFields as any).owner = extraOwner;
    if (typeof extraSource === 'string') (updateFields as any).source = extraSource;
    if (extraDesktop === null || typeof extraDesktop === 'string') (updateFields as any).desktop = extraDesktop;

    const updatedSong = await Song.findByIdAndUpdate(
      id,
      updateFields,
      { new: true, runValidators: true }
    );
    
    if (!updatedSong) {
      return NextResponse.json(
        { success: false, error: 'Song not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: updatedSong });
  } catch (error) {
    console.error('Error updating song:', error);
    
    // Handle MongoDB connection errors specifically
    if (error instanceof Error && error.name === 'MongoNetworkError') {
      return NextResponse.json(
        { success: false, error: 'Database connection failed. Please check your MongoDB connection.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to update song' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorizedResponse = requireAdmin(request);

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  try {
    await connectDB();
    const { id } = await params;
    
    const deletedSong = await Song.findByIdAndDelete(id);
    
    if (!deletedSong) {
      return NextResponse.json(
        { success: false, error: 'Song not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: deletedSong });
  } catch (error) {
    console.error('Error deleting song:', error);
    
    // Handle MongoDB connection errors specifically
    if (error instanceof Error && error.name === 'MongoNetworkError') {
      return NextResponse.json(
        { success: false, error: 'Database connection failed. Please check your MongoDB connection.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to delete song' },
      { status: 500 }
    );
  }
}
