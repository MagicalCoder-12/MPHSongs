import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Song from '@/lib/models/Song';

// Define allowed languages with display names
const ALLOWED_LANGUAGES = ['Telugu', 'Hindi', 'English', 'Other'] as const;
type Language = typeof ALLOWED_LANGUAGES[number];

// Helper to validate language input
function isValidLanguage(lang: unknown): lang is Language {
  return typeof lang === 'string' && ALLOWED_LANGUAGES.includes(lang as Language);
}

export async function GET(request: NextRequest) {
  try {
    // 🔍 Log the Vercel function's real outbound IP
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    console.log('🌐 Vercel Outbound Request');
    console.log('📍 IP Address:', clientIP);
    console.log('📦 User Agent:', userAgent);
    console.log('🕒 Timestamp:', new Date().toISOString());
    console.log('🎯 Method:', request.method);
    console.log('🔗 Path:', request.url);

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

    return NextResponse.json({ success: true, data: songs });
  } catch (error) {
    console.error('❌ Error fetching songs:', error);

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
    // 🔍 Log the incoming request IP
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    console.log('📥 POST Request Received');
    console.log('📍 Client IP:', clientIP);
    console.log('📦 User Agent:', userAgent);
    console.log('🕒 Timestamp:', new Date().toISOString());

    await connectDB();

    const body = await request.json();
    const { title, language, lyrics, isChoirPractice = false } = body;

    // ✅ Validate required fields
    if (!title || !lyrics) {
      return NextResponse.json(
        { success: false, error: 'Title and lyrics are required' },
        { status: 400 }
      );
    }

    // ✅ Validate language
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

    console.log('✅ Song created successfully');
    console.log('📝 Song ID:', newSong._id);
    console.log('🎤 Title:', newSong.title);
    console.log('🗣️ Language:', newSong.language);
    console.log('🔗 From IP:', clientIP);

    return NextResponse.json({ success: true, data: newSong }, { status: 201 });
  } catch (error) {
    console.error('❌ Error creating song:', error);

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