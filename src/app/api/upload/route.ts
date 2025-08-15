import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData()
    const file: File | null = data.get('image') as unknown as File
    const songId = data.get('songId') as string

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    if (!songId) {
      return NextResponse.json({ error: 'Song ID is required' }, { status: 400 })
    }

    // Check if song exists
    const song = await db.song.findUnique({
      where: { id: songId }
    })

    if (!song) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique filename
    const fileName = `${songId}-${Date.now()}-${file.name}`
    const path = join(process.cwd(), 'public', 'uploads', fileName)

    // Ensure uploads directory exists
    await mkdir(join(process.cwd(), 'public', 'uploads'), { recursive: true })

    // Save file
    await writeFile(path, buffer)

    // Update song with image URL
    const imageUrl = `/uploads/${fileName}`
    await db.song.update({
      where: { id: songId },
      data: { imageUrl }
    })

    return NextResponse.json({ 
      message: 'File uploaded successfully',
      imageUrl 
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  }
}