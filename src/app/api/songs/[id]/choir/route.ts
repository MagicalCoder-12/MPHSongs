import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Song from '@/lib/models/Song';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { isChoirPractice } = body;
    
    const updatedSong = await Song.findByIdAndUpdate(
      params.id,
      { isChoirPractice },
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
    console.error('Error updating song choir status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update song choir status' },
      { status: 500 }
    );
  }
}