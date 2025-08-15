import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Song from '@/lib/models/Song';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const song = await Song.findById(params.id);
    
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
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { title, language, lyrics, isChoirPractice } = body;
    
    const updatedSong = await Song.findByIdAndUpdate(
      params.id,
      { title, language, lyrics, isChoirPractice },
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
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const deletedSong = await Song.findByIdAndDelete(params.id);
    
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