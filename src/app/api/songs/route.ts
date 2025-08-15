import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const choirOnly = searchParams.get('choirOnly') === 'true'

    let songs = await db.song.findMany({
      orderBy: {
        title: 'asc'
      }
    })

    // Filter by search term if provided
    if (search) {
      const searchLower = search.toLowerCase()
      songs = songs.filter(song => 
        song.title.toLowerCase().includes(searchLower) ||
        song.artist?.toLowerCase().includes(searchLower) ||
        song.lyrics.toLowerCase().includes(searchLower)
      )
    }

    // Filter by choir practice if requested
    if (choirOnly) {
      songs = songs.filter(song => song.inChoirPractice)
    }

    return NextResponse.json(songs)
  } catch (error) {
    console.error('Error fetching songs:', error)
    return NextResponse.json({ error: 'Failed to fetch songs' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, artist, lyrics, language } = body

    if (!title || !lyrics) {
      return NextResponse.json({ error: 'Title and lyrics are required' }, { status: 400 })
    }

    const song = await db.song.create({
      data: {
        title,
        artist: artist || null,
        lyrics,
        language: language || 'English',
        isNew: true,
        inChoirPractice: false
      }
    })

    return NextResponse.json(song, { status: 201 })
  } catch (error) {
    console.error('Error creating song:', error)
    return NextResponse.json({ error: 'Failed to create song' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const result = await db.song.deleteMany({})
    
    return NextResponse.json({ 
      message: 'All songs deleted successfully',
      count: result.count 
    })
  } catch (error) {
    console.error('Error deleting all songs:', error)
    return NextResponse.json({ error: 'Failed to delete all songs' }, { status: 500 })
  }
}