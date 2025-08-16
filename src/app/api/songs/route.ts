import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Song from '@/lib/models/Song';

// Define allowed languages
const ALLOWED_LANGUAGES = ['Telugu', 'Hindi', 'English', 'Other'] as const;
type Language = typeof ALLOWED_LANGUAGES[number];

// Helper to validate language input
function isValidLanguage(lang: unknown): lang is Language {
  return typeof lang === 'string' && ALLOWED_LANGUAGES.includes(lang as Language);
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const choirOnly = searchParams.get('choirOnly') === 'true';
    const sortBy = searchParams.get('sortBy') || 'recent'; // 'recent' or 'alphabetical'
    
    const query: any = {};
    
    if (choirOnly) {
      query.isChoirPractice = true;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { lyrics: { $regex: search, $options: 'i' } }
      ];
    }
    
    let sortOptions = {};
    if (sortBy === 'alphabetical') {
      sortOptions = { title: 1 };
    } else {
      sortOptions = { createdAt: -1 };
    }
    
    const songs = await Song.find(query).sort(sortOptions);
    
    return NextResponse.json({ success: true,  songs });
  } catch (error) {
    console.error('Error fetching songs:', error);
    
    // Handle MongoDB connection errors specifically
    if (error instanceof Error && error.name === 'MongoNetworkError') {
      return NextResponse.json(
        { success: false, error: 'Database connection failed. Please check your MongoDB connection.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch songs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { title, language, lyrics, isChoirPractice = false } = body;
    
    // Validate required fields
    if (!title || !lyrics) {
      return NextResponse.json(
        { success: false, error: 'Title and lyrics are required' },
        { status: 400 }
      );
    }
    
    // Validate language
    if (!language || !isValidLanguage(language)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid language. Must be one of: ${ALLOWED_LANGUAGES.join(', ')}` 
        },
        { status: 400 }
      );
    }

    const newSong = new Song({
      title: title.trim(),
      language,
      lyrics: lyrics.trim(),
      isChoirPractice: !!isChoirPractice
    });
    
    await newSong.save();
    
    return NextResponse.json({ success: true,  newSong }, { status: 201 });
  } catch (error) {
    console.error('Error creating song:', error);
    
    // Handle MongoDB connection errors specifically
    if (error instanceof Error && error.name === 'MongoNetworkError') {
      return NextResponse.json(
        { success: false, error: 'Database connection failed. Please check your MongoDB connection.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to create song' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    
    const { id } = params;
    const body = await request.json();
    const { title, language, lyrics, isChoirPractice } = body;
    
    // Validate required fields
    if (!title || !lyrics) {
      return NextResponse.json(
        { success: false, error: 'Title and lyrics are required' },
        { status: 400 }
      );
    }
    
    // Validate language
    if (!language || !isValidLanguage(language)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid language. Must be one of: ${ALLOWED_LANGUAGES.join(', ')}` 
        },
        { status: 400 }
      );
    }

    const updatedSong = await Song.findByIdAndUpdate(
      id,
      {
        title: title.trim(),
        language,
        lyrics: lyrics.trim(),
        isChoirPractice: !!isChoirPractice
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedSong) {
      return NextResponse.json(
        { success: false, error: 'Song not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true,  updatedSong });
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

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    
    const { id } = params;
    
    const deletedSong = await Song.findByIdAndDelete(id);
    
    if (!deletedSong) {
      return NextResponse.json(
        { success: false, error: 'Song not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, message: 'Song deleted successfully' });
  } catch (error) {
    console.error('Error deleting song:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to delete song' },
      { status: 500 }
    );
  }
}