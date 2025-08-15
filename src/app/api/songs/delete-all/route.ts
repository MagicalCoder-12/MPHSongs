import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Song from '@/lib/models/Song';

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    
    const result = await Song.deleteMany({});
    
    return NextResponse.json({ 
      success: true, 
      message: `Deleted ${result.deletedCount} songs` 
    });
  } catch (error) {
    console.error('Error deleting all songs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete songs' },
      { status: 500 }
    );
  }
}