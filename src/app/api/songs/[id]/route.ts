import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { title, artist, lyrics, language, inChoirPractice } = body

    const existingSong = await db.song.findUnique({
      where: { id: params.id }
    })

    if (!existingSong) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 })
    }

    const song = await db.song.update({
      where: { id: params.id },
      data: {
        ...(title && { title }),
        ...(artist !== undefined && { artist: artist || null }),
        ...(lyrics && { lyrics }),
        ...(language && { language }),
        ...(inChoirPractice !== undefined && { inChoirPractice }),
        isNew: false // Mark as not new when updated
      }
    })

    return NextResponse.json(song)
  } catch (error) {
    console.error('Error updating song:', error)
    return NextResponse.json({ error: 'Failed to update song' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const existingSong = await db.song.findUnique({
      where: { id: params.id }
    })

    if (!existingSong) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 })
    }

    await db.song.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Song deleted successfully' })
  } catch (error) {
    console.error('Error deleting song:', error)
    return NextResponse.json({ error: 'Failed to delete song' }, { status: 500 })
  }
}