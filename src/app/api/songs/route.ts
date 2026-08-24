import { NextRequest, NextResponse } from 'next/server';
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
    try { await Song.updateMany({ owner: { $exists: false } } as any, { $set: { owner: 'web' } }); } catch {}
    try { await Song.updateMany({ owner: null } as any, { $set: { owner: 'web' } }); } catch {}
    
    const searchParams = request.nextUrl.searchParams;
    const search = sanitizeSearchTerm(searchParams.get('search'));
    const choirOnly = searchParams.get('choirOnly') === 'true';
    const christmasOnly = searchParams.get('christmasOnly') === 'true';
    const tag = sanitizeSearchTerm(searchParams.get('tag'));
    const owner = sanitizeSearchTerm(searchParams.get('owner'));
    const sortBy = searchParams.get('sortBy') || 'alphabetical';
    
    const query: any = {};
    
    if (choirOnly) {
      query.isChoirPractice = true;
    }

    if (tag) {
      query.tags = tag;
    }
    
    if (christmasOnly) {
      query.isChristmasSong = true;
    }

    if (owner && (owner === 'web' || owner === 'app')) {
      query.owner = owner;
    }
    
    if (search) {
      const escapedSearch = escapeRegex(search);

      query.$or = [
        { title: { $regex: escapedSearch, $options: 'i' } },
        { subtitle: { $regex: escapedSearch, $options: 'i' } },
        { lyrics: { $regex: escapedSearch, $options: 'i' } },
        { tags: { $regex: escapedSearch, $options: 'i' } }
      ];
    }
    
    let sortOptions: any = {};
    if (sortBy === 'alphabetical') {
      sortOptions = { title: 1 };
    } else if (sortBy === 'oldest') {
      sortOptions = { createdAt: 1 };
    } else {
      sortOptions = { createdAt: -1 };
    }
    
    // Use lean() for better performance - returns plain JS objects instead of Mongoose docs
    const songs = await Song.find(query).sort(sortOptions).lean();
    
    return NextResponse.json(
      { success: true,  songs },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
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
    const parsedPayload = parseSongPayload(body);

    if (!parsedPayload.success) {
      return NextResponse.json(
        { success: false, error: parsedPayload.error },
        { status: 400 }
      );
    }

    const { title, subtitle, songLanguage, lyrics, isChoirPractice, isChristmasSong, tags, owner, source, desktop } = parsedPayload.data as any;

    const isAppOwner = owner === 'app';
    const finalTags = isAppOwner
      ? (tags.includes('church') ? tags : [...tags, 'church'])
      : (tags.length ? tags : ['web']);
    const finalSource = source ?? (isAppOwner ? 'desktop' : 'web');
    const finalWeb = isAppOwner ? undefined : 'true';
    const finalDesktop = isAppOwner ? 'true' : (desktop ?? null);

    const newSong = await Song.create({
      title,
      subtitle,
      songLanguage,
      lyrics,
      isChoirPractice,
      isChristmasSong,
      tags: finalTags,
      owner: owner ?? 'web',
      source: finalSource,
      web: finalWeb,
      desktop: finalDesktop as any,
    });
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

    const { title, subtitle, songLanguage, lyrics, isChoirPractice, tags } = parsedPayload.data;
    const extraOwner = (parsedPayload.data as any).owner;
    const extraSource = (parsedPayload.data as any).source;
    const extraDesktop = (parsedPayload.data as any).desktop;
    const expectedUpdatedAt = (parsedPayload.data as any).expectedUpdatedAt as string | undefined;

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
      tags,
    };

    if (subtitle !== undefined) {
      updateFields.subtitle = subtitle;
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
