import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import Song from '@/lib/models/Song';

export async function PATCH(request: NextRequest) {
  const adminCheck = await requireAdmin(request);

  if (!adminCheck.isAdmin) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { ids, addTags, removeTags }: { ids: string[]; addTags: string[]; removeTags: string[] } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No song IDs provided' },
        { status: 400 }
      );
    }

    const validAddTags = Array.isArray(addTags)
      ? addTags.filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
      : [];

    const validRemoveTags = Array.isArray(removeTags)
      ? removeTags.filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
      : [];

    let modifiedCount = 0;

    if (validAddTags.length > 0) {
      const addResult = await Song.updateMany(
        { _id: { $in: ids } },
        { $addToSet: { tags: { $each: validAddTags } } }
      );
      modifiedCount += addResult.modifiedCount;
    }

    if (validRemoveTags.length > 0) {
      const removeResult = await Song.updateMany(
        { _id: { $in: ids } },
        { $pullAll: { tags: validRemoveTags } }
      );
      modifiedCount += removeResult.modifiedCount;
    }

    return NextResponse.json({ success: true, modifiedCount });
  } catch (error) {
    console.error('Bulk tag update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update tags' },
      { status: 500 }
    );
  }
}
