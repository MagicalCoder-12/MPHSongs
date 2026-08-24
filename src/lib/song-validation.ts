import { GOOD_FRIDAY_TAG, CHURCH_TAG, YOUTH_TAG, SUNDAY_SCHOOL_TAG } from '@/lib/song-tags';

export const ALLOWED_LANGUAGES = ['Telugu', 'Hindi', 'English', 'Other'] as const;
export type SongLanguage = typeof ALLOWED_LANGUAGES[number];

const MAX_SEARCH_LENGTH = 100;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isValidSongLanguage(lang: unknown): lang is SongLanguage {
  return typeof lang === 'string' && ALLOWED_LANGUAGES.includes(lang as SongLanguage);
}

export function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function sanitizeSearchTerm(value: string | null) {
  if (!value) {
    return '';
  }

  return value.trim().slice(0, MAX_SEARCH_LENGTH);
}

type SongPayload = {
  title: string;
  subtitle?: string;
  songLanguage: SongLanguage;
  lyrics: string;
  isChoirPractice: boolean;
  isChristmasSong: boolean;
  tags: string[];
  owner: 'web' | 'app';
  source?: string;
  desktop?: string | null;
  updatedAt?: string;
  expectedUpdatedAt?: string;
};

type SongPayloadResult =
  | { success: true; data: SongPayload }
  | { success: false; error: string };

export function parseSongPayload(body: unknown): SongPayloadResult {
  if (!isRecord(body)) {
    return { success: false, error: 'Invalid request body' };
  }

  const rawTitle = body.title;
  const rawLyrics = body.lyrics;
  const rawSongLanguage = body.songLanguage ?? body.language;

  if (typeof rawTitle !== 'string' || typeof rawLyrics !== 'string') {
    return { success: false, error: 'Title and lyrics must be text values' };
  }

  const title = rawTitle.trim();
  const rawSubtitle = body.subtitle;
  const subtitle = typeof rawSubtitle === 'string' ? rawSubtitle.trim() || undefined : undefined;
  const lyrics = rawLyrics.trim();

  if (!title || !lyrics) {
    return { success: false, error: 'Title and lyrics are required' };
  }

  if (!isValidSongLanguage(rawSongLanguage)) {
    return {
      success: false,
      error: `Invalid language. Must be one of: ${ALLOWED_LANGUAGES.join(', ')}`,
    };
  }

  const rawTags = Array.isArray(body.tags) ? body.tags : [];
  const isGoodFridaySong = Boolean(body.isGoodFridaySong);
  const isChurchSong = Boolean(body.isChurchSong);
  const isYouthSong = Boolean(body.isYouthSong);
  const isSundaySchoolSong = Boolean(body.isSundaySchoolSong);

  const normalizedTags = Array.from(
    new Set(
      rawTags
        .filter((tag): tag is string => typeof tag === 'string')
        .map((tag) => tag.trim())
        .filter(Boolean)
    )
  );

  const categoryTags: string[] = [];
  if (isChurchSong) categoryTags.push(CHURCH_TAG);
  if (isYouthSong) categoryTags.push(YOUTH_TAG);
  if (isSundaySchoolSong) categoryTags.push(SUNDAY_SCHOOL_TAG);

  let tags = Array.from(new Set([...normalizedTags, ...categoryTags]));

  tags = isGoodFridaySong
    ? Array.from(new Set([...tags, GOOD_FRIDAY_TAG]))
    : tags.filter((tag) => tag !== GOOD_FRIDAY_TAG);

  const rawOwner = body.owner;
  const owner: 'web' | 'app' = rawOwner === 'app' ? 'app' : 'web';
  if (owner === 'app' && !tags.includes(CHURCH_TAG)) tags.push(CHURCH_TAG);
  if (owner === 'web' && tags.length === 0) tags.push('web');
  const rawSource = typeof body.source === 'string' ? body.source : undefined;
  const rawDesktop = typeof body.desktop === 'string' ? body.desktop : body.desktop === null ? null : undefined;
  const rawUpdatedAt = typeof body.updatedAt === 'string' ? body.updatedAt : undefined;
  const rawExpectedUpdatedAt = typeof body.expectedUpdatedAt === 'string' ? body.expectedUpdatedAt : undefined;

  return {
    success: true,
    data: {
      title,
      subtitle,
      songLanguage: rawSongLanguage,
      lyrics,
      isChoirPractice: Boolean(body.isChoirPractice),
      isChristmasSong: Boolean(body.isChristmasSong),
      tags,
      owner,
      source: rawSource,
      desktop: rawDesktop,
      updatedAt: rawUpdatedAt,
      expectedUpdatedAt: rawExpectedUpdatedAt,
    },
  };
}
