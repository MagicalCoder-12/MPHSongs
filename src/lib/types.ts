export interface Song {
  _id: string;
  title: string;
  songLanguage: string;
  lyrics: string;
  isChoirPractice: boolean;
  isChristmasSong?: boolean;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export type SongFormData = {
  title: string;
  songLanguage: string;
  lyrics: string;
  isChoirPractice: boolean;
  isGoodFridaySong: boolean;
  isChristmasSong: boolean;
  isChurchSong: boolean;
  isYouthSong: boolean;
  isSundaySchoolSong: boolean;
};
