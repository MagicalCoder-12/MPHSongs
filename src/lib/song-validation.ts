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
  songLanguage: SongLanguage;
  lyrics: string;
  isChoirPractice: boolean;
  isChristmasSong: boolean;
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

  return {
    success: true,
    data: {
      title,
      songLanguage: rawSongLanguage,
      lyrics,
      isChoirPractice: Boolean(body.isChoirPractice),
      isChristmasSong: Boolean(body.isChristmasSong),
    },
  };
}
