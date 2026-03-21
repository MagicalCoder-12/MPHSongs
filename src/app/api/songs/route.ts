import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import connectDB from '@/lib/mongodb';
import Song from '@/lib/models/Song';
import {
  escapeRegex,
  parseSongPayload,
  sanitizeSearchTerm,
} from '@/lib/song-validation';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const searchParams = request.nextUrl.searchParams;
    const search = sanitizeSearchTerm(searchParams.get('search'));
    const choirOnly = searchParams.get('choirOnly') === 'true';
    const christmasOnly = searchParams.get('christmasOnly') === 'true';
    const sortBy = searchParams.get('sortBy') || 'recent'; // 'recent' or 'alphabetical'
    
    const query: any = {};
    
    if (choirOnly) {
      query.isChoirPractice = true;
    }
    
    if (christmasOnly) {
      query.isChristmasSong = true;
    } else if (!choirOnly) {
      // In the regular songs tab, exclude Christmas songs
      query.isChristmasSong = { $ne: true };
    }
    
    if (search) {
      const escapedSearch = escapeRegex(search);

      query.$or = [
        { title: { $regex: escapedSearch, $options: 'i' } },
        { lyrics: { $regex: escapedSearch, $options: 'i' } }
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
  const unauthorizedResponse = requireAdmin(request);

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  try {
    await connectDB();
    const body = await request.json();
    const parsedPayload = parseSongPayload(body);

    if (!parsedPayload.success) {
      return NextResponse.json(
        { success: false, error: parsedPayload.error },
        { status: 400 }
      );
    }

    const { title, songLanguage, lyrics, isChoirPractice, isChristmasSong } = parsedPayload.data;

    const newSong = new Song({
      title,
      songLanguage,
      lyrics,
      isChoirPractice,
      isChristmasSong
    });
    await newSong.save();
    return NextResponse.json({ success: true,  newSong }, { status: 201 });
  } catch (error) {
    console.error('Error creating song:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to create song' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const unauthorizedResponse = requireAdmin(request);

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  try {
    await connectDB();
    const { id } = params;
    const body = await request.json();
    const parsedPayload = parseSongPayload(body);

    if (!parsedPayload.success) {
      return NextResponse.json(
        { success: false, error: parsedPayload.error },
        { status: 400 }
      );
    }

    const { title, songLanguage, lyrics, isChoirPractice } = parsedPayload.data;

    const updatedSong = await Song.findByIdAndUpdate(
      id,
      {
        title,
        songLanguage,
        lyrics,
        isChoirPractice
      },
      { new: true, runValidators: true }
    );
    if (!updatedSong) {
      return NextResponse.json(
        { success: false, error: 'Song not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, updatedSong }, { status: 200 });
  } catch (error) {
    console.error('Error updating song:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to update song' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const unauthorizedResponse = requireAdmin(request);

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

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
