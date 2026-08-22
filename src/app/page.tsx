'use client';

import { useState, useEffect, useRef, useCallback, type ChangeEvent } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Search, Music, Trash2, Edit, Users, List, Clock, SortAsc, AlertCircle, LogIn, LogOut, Loader2, X, ArrowUp, Star, BookOpen, Download, Upload, Mic, MicOff } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { PWAInstall } from '@/components/ui/pwa-install';
import { IOSInstall } from '@/components/ui/ios-install';
import {
  isValidSiteTheme,
  SITE_THEME_LABELS,
  type SiteTheme,
} from '@/lib/site-theme';
import { GOOD_FRIDAY_TAG, CHURCH_TAG, YOUTH_TAG, SUNDAY_SCHOOL_TAG, CATEGORY_TAGS } from '@/lib/song-tags';
import type { Song, SongFormData } from '@/lib/types';

import { SongCard } from '@/components/ui/song-card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

const SITE_THEME_STORAGE_KEY = 'mph-site-theme';
const GOOD_FRIDAY_TAB = 'good-friday';
const CHRISTMAS_TAB = 'christmas';
const CHOIR_TAB = 'choir-practice';

// Extend window interface for PWA events
declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onstart: (() => void) | null;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

const getEmptyFormData = (activeTab: string): SongFormData => ({
  title: '',
  subtitle: '',
  songLanguage: 'Telugu',
  lyrics: '',
  isChoirPractice: false,
  isGoodFridaySong: activeTab === GOOD_FRIDAY_TAB,
  isChristmasSong: activeTab === CHRISTMAS_TAB,
  isChurchSong: false,
  isYouthSong: false,
  isSundaySchoolSong: false,
});

const csvEscape = (value: string) => `"${value.replace(/"/g, '""')}"`;

const parseCsv = (text: string) => {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = '';
  let insideQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];
    if (character === '"' && insideQuotes && nextCharacter === '"') {
      value += '"';
      index += 1;
    } else if (character === '"') {
      insideQuotes = !insideQuotes;
    } else if (character === ',' && !insideQuotes) {
      row.push(value);
      value = '';
    } else if ((character === '\n' || character === '\r') && !insideQuotes) {
      if (character === '\r' && nextCharacter === '\n') index += 1;
      row.push(value);
      rows.push(row);
      row = [];
      value = '';
    } else {
      value += character;
    }
  }

  if (value || row.length > 0) {
    row.push(value);
    rows.push(row);
  }
  return rows;
};

export default function Home() {
  const [activeTab, setActiveTab] = useState('all-songs');
  const [songs, setSongs] = useState<Song[]>([]);
  const [choirSongs, setChoirSongs] = useState<Song[]>([]);
  const [songCounts, setSongCounts] = useState({ all: 0, choir: 0, goodFriday: 0, christmas: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [siteTheme, setSiteTheme] = useState<SiteTheme>('normal');
  const [isSavingSiteTheme, setIsSavingSiteTheme] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'alphabetical'>('recent');
  const [categoryFilter, setCategoryFilter] = useState<typeof CATEGORY_TAGS[number] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [formData, setFormData] = useState<SongFormData>(getEmptyFormData('all-songs'));
  // Admin authentication state
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  // Duplicate detection state
  const [duplicateWarning, setDuplicateWarning] = useState<Song | null>(null);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  // Offline state
  const [isOnline, setIsOnline] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [selectedSongIds, setSelectedSongIds] = useState<Set<string>>(new Set());
  const [showBulkTagDialog, setShowBulkTagDialog] = useState(false);
  const [bulkTagAdd, setBulkTagAdd] = useState<string[]>([]);
  const [bulkTagRemove, setBulkTagRemove] = useState<string[]>([]);
  const [importInputKey, setImportInputKey] = useState(0);
  const [speechLanguage, setSpeechLanguage] = useState<'en-IN' | 'te-IN'>('en-IN');
  const [isListening, setIsListening] = useState(false);
  const { toast } = useToast();
  
  // Refs
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const speechRecognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const detectDuplicates = useCallback((newSong: SongFormData, existingSongs: Song[]) => {
    return existingSongs.some(song => {
      if (song.title.toLowerCase().trim() === newSong.title.toLowerCase().trim()) {
        return true;
      }
      const titleDiff = Math.abs(song.title.length - newSong.title.length);
      if (titleDiff > 2) {
        return false;
      }
      const a = song.title.toLowerCase().trim();
      const b = newSong.title.toLowerCase().trim();
      if (a.length === 0) return b.length < 3;
      if (b.length === 0) return a.length < 3;
      let previousRow = Array.from({ length: a.length + 1 }, (_, i) => i);
      for (let j = 1; j <= b.length; j++) {
        let currentRow = [j];
        let minInRow = j;
        for (let i = 1; i <= a.length; i++) {
          const cost = a[i - 1] === b[j - 1] ? 0 : 1;
          currentRow.push(Math.min(currentRow[i - 1] + 1, previousRow[i] + 1, previousRow[i - 1] + cost));
        }
        if (Math.min(...currentRow) >= 3) return false;
        previousRow = currentRow;
      }
      return previousRow[a.length] < 3;
    });
  }, []);

  // Check if app is installed and online status
  useEffect(() => {
    // Check if the app is running as standalone
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsAppInstalled(true);
    }
    
    // Check if app is installed via navigator
    if ((window as any).navigator.standalone) {
      setIsAppInstalled(true);
    }
    
    // Check online status
    setIsOnline(navigator.onLine);
    
    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleScroll = () => setShowScrollTop(window.scrollY > 320);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('scroll', handleScroll);
      // Clean up debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const fetchSongs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        search: searchTerm,
        sortBy,
        ...(activeTab === CHOIR_TAB && { choirOnly: 'true' }),
        ...(activeTab === GOOD_FRIDAY_TAB && { tag: GOOD_FRIDAY_TAG }),
        ...(activeTab === CHRISTMAS_TAB && { christmasOnly: 'true' }),
        ...(activeTab === 'all-songs' && categoryFilter && { tag: categoryFilter }),
      });
      
      const response = await fetch(`/api/songs?${params.toString()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      const result = await response.json();
      
      if (result.success) {
        if (activeTab === CHOIR_TAB) {
          setChoirSongs(result.songs || []);
        } else {
          setSongs(result.songs || []);
        }

        try {
          const countRequests = [
            fetch('/api/songs?sortBy=recent'),
            fetch('/api/songs?sortBy=recent&choirOnly=true'),
            fetch(`/api/songs?sortBy=recent&tag=${encodeURIComponent(GOOD_FRIDAY_TAG)}`),
            fetch('/api/songs?sortBy=recent&christmasOnly=true'),
          ];
          const countResponses = await Promise.all(countRequests);
          const countResults = await Promise.all(countResponses.map(async (response) => {
            const countResult = await response.json();
            return response.ok && countResult.success ? countResult.songs.length : null;
          }));

          if (countResults.every((count) => count !== null)) {
            setSongCounts({
              all: countResults[0],
              choir: countResults[1],
              goodFriday: countResults[2],
              christmas: countResults[3],
            });
          }
        } catch (countError) {
          console.warn('Unable to refresh song tab counts:', countError);
        }
      } else {
        setError(result.error || 'Failed to fetch songs');
        console.error('API Error:', result.error);
      }
    } catch (error) {
      console.error('Error fetching songs:', error);
      setError('Network error. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAdminSession = async () => {
    try {
      const response = await fetch('/api/admin/session');
      const result = await response.json();

      if (result.success) {
        setIsAdmin(Boolean(result.isAdmin));
      }
    } catch (error) {
      console.error('Error checking admin session:', error);
    }
  };

  const loadSiteTheme = async () => {
    try {
      const response = await fetch('/api/site-theme', { cache: 'no-store' });
      const result = await response.json();

      if (result.success && isValidSiteTheme(result.siteTheme)) {
        setSiteTheme(result.siteTheme);
      }
    } catch (error) {
      console.error('Error fetching site theme:', error);
    }
  };

  const handleLogin = async () => {
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });

      const result = await response.json();

      if (result.success) {
        setIsAdmin(true);
        setShowLoginDialog(false);
        setLoginForm({ username: '', password: '' });
        toast({ title: 'Signed in', description: 'Admin controls are now available.' });
        return;
      }

      alert(result.error || 'Invalid credentials. Please try again.');
    } catch (error) {
      console.error('Error logging in:', error);
      alert('Unable to log in right now. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      setIsAdmin(false);
      toast({ title: 'Signed out' });
    }
  };

  const handleSiteThemeChange = async (value: SiteTheme) => {
    const previousTheme = siteTheme;
    setSiteTheme(value);
    setIsSavingSiteTheme(true);

    try {
      const response = await fetch('/api/site-theme', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteTheme: value })
      });

      const result = await response.json();

      if (!result.success) {
        if (response.status === 401) {
          setIsAdmin(false);
        }

        setSiteTheme(previousTheme);
        alert(result.error || 'Failed to update site theme.');
      }
    } catch (error) {
      console.error('Error updating site theme:', error);
      setSiteTheme(previousTheme);
      alert('Unable to update the site theme right now.');
    } finally {
      setIsSavingSiteTheme(false);
    }
  };

  const handleCreateSong = async () => {
    // Check for duplicates before creating
    if (detectDuplicates(formData, songs)) {
      setDuplicateWarning(songs.find(s => s.title.toLowerCase().trim() === formData.title.toLowerCase().trim()) || songs[0]);
      setShowDuplicateDialog(true);
      return;
    }
    
    try {
      const response = await fetch('/api/songs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        setDialogError(null);
        setFormData(getEmptyFormData(activeTab));
        setIsDialogOpen(false);
        await fetchSongs();
        toast({ title: 'Song saved', description: `${formData.title} was added.` });
      } else {
        setDialogError(result.error || 'Failed to create song');
        console.error('Create Error:', result.error);
      }
    } catch (error) {
      console.error('Error creating song:', error);
      setDialogError('Network error. Please check your connection.');
    }
  };

  const handleCreateSongOverride = async () => {
    setShowDuplicateDialog(false);
    setDuplicateWarning(null);
    
    try {
      const response = await fetch('/api/songs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        setDialogError(null);
        setFormData(getEmptyFormData(activeTab));
        setIsDialogOpen(false);
        await fetchSongs();
        toast({ title: 'Song saved', description: `${formData.title} was added.` });
      } else {
        setDialogError(result.error || 'Failed to create song');
        console.error('Create Error:', result.error);
      }
    } catch (error) {
      console.error('Error creating song:', error);
      setDialogError('Network error. Please check your connection.');
    }
  };

  const handleUpdateSong = async () => {
    if (!editingSong) return;
    
    try {
      const response = await fetch(`/api/songs/${editingSong._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        setDialogError(null);
        setEditingSong(null);
        setFormData(getEmptyFormData(activeTab));
        setIsDialogOpen(false);
        await fetchSongs();
        toast({ title: 'Song updated', description: `${formData.title} was updated.` });
      } else {
        setDialogError(result.error || 'Failed to update song');
        console.error('Update Error:', result.error);
      }
    } catch (error) {
      console.error('Error updating song:', error);
      setDialogError('Network error. Please check your connection.');
    }
  };

  const handleDeleteSong = async (id: string) => {
    // Only allow admin to delete songs
    if (!isAdmin) {
      alert('You must be logged in as admin to delete songs.');
      return;
    }
    
    try {
      const response = await fetch(`/api/songs/${id}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        await fetchSongs();
        toast({ title: 'Song deleted' });
      } else {
        if (response.status === 401) {
          setIsAdmin(false);
        }
        console.error('Delete failed:', result.error);
      }
    } catch (error) {
      console.error('Error deleting song:', error);
    }
  };

  const handleDeleteAllSongs = async () => {
    // Only allow admin to delete all songs
    if (!isAdmin) {
      alert('You must be logged in as admin to delete all songs.');
      return;
    }
    
    try {
      const response = await fetch('/api/songs/delete-all', {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        await fetchSongs();
        toast({ title: 'Songs deleted' });
      } else if (response.status === 401) {
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Error deleting all songs:', error);
    }
  };

  const handleToggleChoir = async (song: Song) => {
    try {
      const response = await fetch(`/api/songs/${song._id}/choir`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isChoirPractice: !song.isChoirPractice })
      });
      
      const result = await response.json();
      
      if (result.success) {
        await fetchSongs();
        toast({ title: song.isChoirPractice ? 'Removed from choir' : 'Added to choir' });
      } else {
        console.error('Choir toggle failed:', result.error);
      }
    } catch (error) {
      console.error('Error toggling choir status:', error);
    }
  };

  const handleEditSong = (song: Song) => {
    setEditingSong(song);
    setFormData({
      title: song.title,
      subtitle: song.subtitle ?? '',
      songLanguage: song.songLanguage,
      lyrics: song.lyrics,
      isChoirPractice: song.isChoirPractice,
      isGoodFridaySong: Boolean(song.tags?.includes(GOOD_FRIDAY_TAG)),
      isChristmasSong: Boolean(song.isChristmasSong),
      isChurchSong: Boolean(song.tags?.includes(CHURCH_TAG)),
      isYouthSong: Boolean(song.tags?.includes(YOUTH_TAG)),
      isSundaySchoolSong: Boolean(song.tags?.includes(SUNDAY_SCHOOL_TAG)),
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    setDialogError(null);
    if (editingSong) {
      handleUpdateSong();
    } else {
      handleCreateSong();
    }
  };

  const handleViewDetails = (song: Song) => {
    // This is handled in the dialog component
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    searchInputRef.current?.focus();
  };

  const handleVoiceSearch = () => {
    const speechWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const SpeechRecognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast({ title: 'Voice search unavailable', description: 'Your browser does not support speech recognition.' });
      return;
    }

    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = speechLanguage;
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (transcript) {
        setSearchTerm(transcript);
        toast({ title: 'Voice search', description: `Searching for "${transcript}".` });
      }
    };
    recognition.onerror = (event) => {
      setIsListening(false);
      speechRecognitionRef.current = null;
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        const description = event.error === 'not-allowed'
          ? 'Allow microphone access for localhost and try again.'
          : event.error === 'network'
            ? 'The browser speech service is unavailable. Check your connection or try Chrome.'
            : `Speech recognition error: ${event.error}.`;
        toast({ title: 'Voice search failed', description });
      }
    };
    recognition.onend = () => {
      setIsListening(false);
      speechRecognitionRef.current = null;
    };
    speechRecognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      speechRecognitionRef.current = null;
      setIsListening(false);
      toast({ title: 'Voice search failed', description: 'The microphone could not be started. Check browser permissions.' });
    }
  };

  useEffect(() => () => speechRecognitionRef.current?.stop(), []);

  const handleExportSongs = async (format: 'json' | 'csv') => {
    try {
      const response = await fetch('/api/songs?sortBy=alphabetical', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error('Export failed');

      const exportSongs = result.songs as Song[];
      const content = format === 'json'
        ? JSON.stringify(exportSongs, null, 2)
        : [
            'title,subtitle,songLanguage,lyrics,isChoirPractice,isChristmasSong,tags,createdAt,updatedAt',
            ...exportSongs.map((song) => [
              song.title,
              song.subtitle ?? '',
              song.songLanguage,
              song.lyrics,
              String(song.isChoirPractice),
              String(Boolean(song.isChristmasSong)),
              (song.tags ?? []).join('|'),
              song.createdAt,
              song.updatedAt,
            ].map(csvEscape).join(',')),
          ].join('\n');
      const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/csv' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `mph-songs-${new Date().toISOString().slice(0, 10)}.${format}`;
      link.click();
      URL.revokeObjectURL(link.href);
      toast({ title: 'Songs exported', description: `${exportSongs.length} songs saved as ${format.toUpperCase()}.` });
    } catch {
      toast({ title: 'Export failed', description: 'Unable to download the song backup.' });
    }
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importedSongs = file.name.toLowerCase().endsWith('.csv')
        ? (() => {
            const rows = parseCsv(text);
            const headers = rows.shift()?.map((header) => header.trim()) ?? [];
            return rows.filter((row) => row.some(Boolean)).map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ''])));
          })()
        : JSON.parse(text);
      if (!Array.isArray(importedSongs)) throw new Error('Backup must contain a list of songs');

      let importedCount = 0;
      for (const song of importedSongs) {
        const tags = typeof song.tags === 'string' ? song.tags.split('|').map((tag: string) => tag.trim()).filter(Boolean) : song.tags ?? [];
        const response = await fetch('/api/songs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: song.title,
            subtitle: song.subtitle,
            songLanguage: song.songLanguage,
            lyrics: song.lyrics,
            isChoirPractice: song.isChoirPractice === true || song.isChoirPractice === 'true',
            isChristmasSong: song.isChristmasSong === true || song.isChristmasSong === 'true',
            isGoodFridaySong: tags.includes(GOOD_FRIDAY_TAG),
            isChurchSong: tags.includes(CHURCH_TAG),
            isYouthSong: tags.includes(YOUTH_TAG),
            isSundaySchoolSong: tags.includes(SUNDAY_SCHOOL_TAG),
            tags,
          }),
        });
        if (response.ok && (await response.json()).success) importedCount += 1;
      }
      await fetchSongs();
      toast({ title: 'Songs imported', description: `${importedCount} of ${importedSongs.length} songs imported.` });
    } catch {
      toast({ title: 'Import failed', description: 'Use a valid JSON or CSV song backup.' });
    } finally {
      setImportInputKey((key) => key + 1);
    }
  };

  const handleOpenCreateSongDialog = () => {
    setDialogError(null);
    setEditingSong(null);
    setFormData(getEmptyFormData(activeTab));
    setIsDialogOpen(true);
  };

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBulkTag = async () => {
    if (selectedSongIds.size === 0) return;
    const selectedCount = selectedSongIds.size;

    try {
      const response = await fetch('/api/songs/bulk-tags', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: Array.from(selectedSongIds),
          addTags: bulkTagAdd,
          removeTags: bulkTagRemove,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSelectedSongIds(new Set());
        setBulkTagAdd([]);
        setBulkTagRemove([]);
        setShowBulkTagDialog(false);
        await new Promise(resolve => setTimeout(resolve, 100));
        await fetchSongs();
        toast({ title: 'Tags updated', description: `${selectedCount} songs updated.` });
      } else {
        if (response.status === 401) {
          setIsAdmin(false);
        }
        console.error('Bulk tag update failed:', result.error);
      }
    } catch (error) {
      console.error('Error updating tags in bulk:', error);
    }
  };

  const handleToggleSelectSong = (songId: string) => {
    setSelectedSongIds((prev) => {
      const next = new Set(prev);
      if (next.has(songId)) {
        next.delete(songId);
      } else {
        next.add(songId);
      }
      return next;
    });
  };

  const handleClearSelection = () => {
    setSelectedSongIds(new Set());
  };

  const handleOpenBulkTagDialog = () => {
    setBulkTagAdd([]);
    setBulkTagRemove([]);
    setShowBulkTagDialog(true);
  };

  const toggleBulkAddTag = (tag: string) => {
    setBulkTagAdd((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
    setBulkTagRemove((prev) => prev.filter((t) => t !== tag));
  };

  const toggleBulkRemoveTag = (tag: string) => {
    setBulkTagRemove((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
    setBulkTagAdd((prev) => prev.filter((t) => t !== tag));
  };

  // Cache warming: pre-fetch all songs after mount to populate SW cache
  useEffect(() => {
    if ('serviceWorker' in navigator && 'caches' in window) {
      const timer = setTimeout(async () => {
        try {
          await fetch('/api/songs?sortBy=alphabetical');
        } catch {
          // Silent fail - cache warming is best-effort
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Fetch songs when component mounts or when dependencies change
  useEffect(() => {
    fetchSongs();
  }, [activeTab, searchTerm, sortBy, categoryFilter]);

  useEffect(() => {
    loadAdminSession();
  }, []);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
      if (event.key === '/' && !isTyping) {
        event.preventDefault();
        searchInputRef.current?.focus();
      } else if (event.key === 'Escape') {
        setShowLoginDialog(false);
        setShowDuplicateDialog(false);
        setIsDialogOpen(false);
      }
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  useEffect(() => {
    try {
      const storedTheme = window.localStorage.getItem(SITE_THEME_STORAGE_KEY);

      if (isValidSiteTheme(storedTheme)) {
        setSiteTheme(storedTheme);
      }
    } catch (error) {
      console.error('Error loading stored site theme:', error);
    }

    loadSiteTheme();
  }, []);

  useEffect(() => {
    document.documentElement.dataset.siteTheme = siteTheme;

    try {
      window.localStorage.setItem(SITE_THEME_STORAGE_KEY, siteTheme);
    } catch (error) {
      console.error('Error storing site theme:', error);
    }

    return () => {
      delete document.documentElement.dataset.siteTheme;
    };
  }, [siteTheme]);

  const isGoodFridayTheme = siteTheme === 'good-friday';
  const isChristmasTheme = siteTheme === 'christmas';
  const currentSongs = activeTab === CHOIR_TAB ? choirSongs : songs;
  const searchPlaceholder = 'Search Songs by lyrics';
  const hasSearchTerm = searchTerm.trim().length > 0;

  const getEmptyStateCopy = (tab: string) => {
    if (hasSearchTerm) {
      return {
        title: 'No matching songs found.',
        description: `No lyrics matched "${searchTerm.trim()}". Try another word or clear the search.`,
      };
    }

    if (tab === GOOD_FRIDAY_TAB) {
      return {
        title: 'No Good Friday songs found yet.',
        description: 'Songs tagged as Good Friday will appear here while the Good Friday theme is active.',
      };
    }

    if (tab === CHRISTMAS_TAB) {
      return {
        title: 'No Christmas songs found yet.',
        description: 'Songs tagged as Christmas will appear here while the Christmas theme is active.',
      };
    }

    if (tab === CHOIR_TAB) {
      return {
        title: 'No choir practice songs found.',
        description: 'Add songs to choir practice from the main list.',
      };
    }

    if (isChristmasTheme) {
      return {
        title: 'No songs found yet.',
        description: 'Christmas songs and regular songs will both appear here.',
      };
    }

    if (isGoodFridayTheme) {
      return {
        title: 'No songs found yet.',
        description: 'Add songs here, then tag Good Friday songs when needed.',
      };
    }

    return {
      title: 'No songs found yet.',
      description: 'Create your first song to get started.',
    };
  };

  const renderEmptyState = (tab: string) => {
    const emptyState = getEmptyStateCopy(tab);

    return (
      <div className="col-span-full rounded-md border border-border/70 bg-card/70 px-4 py-8 text-center shadow-sm">
        <p className="font-medium text-foreground">{emptyState.title}</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{emptyState.description}</p>
        {hasSearchTerm && (
          <Button type="button" variant="outline" size="sm" onClick={handleClearSearch} className="mt-4">
            Clear search
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className={`min-h-screen bg-background p-2 sm:p-4 md:p-6 lg:p-8 ${isGoodFridayTheme ? 'good-friday-stage good-friday-shell' : ''}`}>
      <div className={`mx-auto ${isGoodFridayTheme ? 'max-w-5xl' : 'max-w-6xl'}`}>
        {/* Offline Banner */}
        {!isOnline && (
          <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <p className="font-medium">You are currently offline</p>
            </div>
            <p className="text-sm mt-1">
              {isAppInstalled 
                ? "You can still access previously viewed content. Changes will sync when you're back online." 
                : "Install the app for full offline functionality."}
            </p>
          </div>
        )}
        
        <div className={`mb-4 gap-3 sm:mb-6 md:mb-8 ${isGoodFridayTheme ? 'good-friday-header' : ''} ${!isGoodFridayTheme ? 'flex flex-col sm:flex-row justify-between items-center sm:gap-4' : ''}`}>
          <div className={`flex items-center gap-2 sm:gap-3 ${isGoodFridayTheme ? 'good-friday-brand' : ''}`}>
            {!isGoodFridayTheme && <Music className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />}
            <div>
              <h1
                className={`text-xl font-bold sm:text-2xl md:text-3xl ${
                  isGoodFridayTheme ? 'good-friday-title font-[family:var(--font-playfair)] tracking-[0.03em]' : ''
                }`}
              >
                {isGoodFridayTheme ? (
                  <>
                    <span className="good-friday-title-song">Song Lyrics</span>{' '}
                    <span className="good-friday-title-manager">Manager</span>
                  </>
                ) : (
                  'Song Lyrics Manager'
                )}
              </h1>
              <p className={`text-xs sm:text-sm text-muted-foreground ${isGoodFridayTheme ? 'good-friday-subtitle' : ''}`}>
                Site theme: {SITE_THEME_LABELS[siteTheme]}
              </p>
            </div>
          </div>

          <div className={`flex w-full flex-wrap items-center justify-center gap-2 sm:w-auto ${isGoodFridayTheme ? 'good-friday-toolbar' : ''}`}>
            <ThemeToggle className={`${isGoodFridayTheme ? 'good-friday-action-button' : ''}`} />
            {isAdmin && (
              <div className="w-[150px] sm:w-[170px]">
                <Select
                  value={siteTheme}
                  onValueChange={(value: SiteTheme) => handleSiteThemeChange(value)}
                  disabled={isSavingSiteTheme}
                >
                <SelectTrigger className="h-8 sm:h-9 md:h-10">
                    <SelectValue placeholder="Site theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="good-friday">Good Friday</SelectItem>
                    <SelectItem value="easter">Easter</SelectItem>
                    <SelectItem value="christmas">Christmas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {!isAppInstalled && (
              <>
                <PWAInstall className={`${isGoodFridayTheme ? 'good-friday-action-button' : ''}`} compact={isGoodFridayTheme} />
                <IOSInstall className={`${isGoodFridayTheme ? 'good-friday-action-button' : ''}`} compact={isGoodFridayTheme} />
              </>
            )}
            <Button onClick={() => void handleExportSongs('json')} variant="outline" size="sm" className="h-8 px-2 sm:h-9 sm:px-3">
              <Download className="h-3 w-3 sm:mr-1 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Export JSON</span>
            </Button>
            {isAdmin && (
              <>
                <Button onClick={() => void handleExportSongs('csv')} variant="outline" size="sm" className="h-8 px-2 sm:h-9 sm:px-3">
                  <Download className="h-3 w-3 sm:mr-1 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Export CSV</span>
                </Button>
                <input
                  key={importInputKey}
                  ref={importInputRef}
                  type="file"
                  accept=".json,.csv,application/json,text/csv"
                  className="hidden"
                  onChange={(event) => { void handleImportFile(event); }}
                />
                <Button onClick={() => importInputRef.current?.click()} variant="outline" size="sm" className="h-8 px-2 sm:h-9 sm:px-3">
                  <Upload className="h-3 w-3 sm:mr-1 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Import</span>
                </Button>
              </>
            )}
            {isAdmin ? (
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className={`h-8 px-2 sm:h-9 sm:px-3 md:h-10 md:px-4 ${isGoodFridayTheme ? 'good-friday-action-button' : ''}`}
              >
                <LogOut className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className={`${isGoodFridayTheme ? 'sr-only' : 'hidden xs:inline text-xs sm:text-sm'}`}>Logout</span>
              </Button>
            ) : (
              <Button
                onClick={() => setShowLoginDialog(true)}
                variant="outline"
                size="sm"
                className={`h-8 px-2 sm:h-9 sm:px-3 md:h-10 md:px-4 ${isGoodFridayTheme ? 'good-friday-action-button' : ''}`}
              >
                <LogIn className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className={`${isGoodFridayTheme ? 'sr-only' : 'hidden xs:inline text-xs sm:text-sm'}`}>Admin Login</span>
              </Button>
            )}
            
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setDialogError(null);
                setEditingSong(null);
                setFormData(getEmptyFormData(activeTab));
              }
            }}>
              <DialogTrigger asChild>
                <Button
                  onClick={handleOpenCreateSongDialog}
                  className={`h-8 px-2 sm:h-9 sm:px-3 md:h-10 md:px-4 ${isGoodFridayTheme ? 'good-friday-add-button' : ''}`}
                >
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className={`${isGoodFridayTheme ? 'sr-only' : 'hidden xs:inline text-xs sm:text-sm'}`}>Add Song</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle>{editingSong ? 'Edit Song' : 'Add New Song'}</DialogTitle>
                  <DialogDescription>
                    {editingSong ? 'Update the song details below.' : 'Create a new song with lyrics.'}
                  </DialogDescription>
                </DialogHeader>
                
                {/* Dialog Error Display */}
                {dialogError && (
                  <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      <p className="font-medium text-sm">Error</p>
                    </div>
                    <p className="text-xs text-destructive/80 mt-1">
                      {dialogError}
                    </p>
                  </div>
                )}
                
                <ScrollArea className="flex-1 max-h-[60vh] overflow-y-auto px-1">
                  <div className="grid gap-4 py-4 pr-2">
                    <div className="grid gap-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Enter song title"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="subtitle">Subtitle (alternative title)</Label>
                      <Input
                        id="subtitle"
                        value={formData.subtitle}
                        onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                        placeholder="Enter alternative title"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="songLanguage">Language</Label>
                      <Select value={formData.songLanguage} onValueChange={(value) => setFormData({ ...formData, songLanguage: value })}>
                        <SelectTrigger id="songLanguage">
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Telugu">Telugu</SelectItem>
                          <SelectItem value="English">English</SelectItem>
                          <SelectItem value="Hindi">Hindi</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="lyrics">Lyrics</Label>
                      <Textarea
                        id="lyrics"
                        value={formData.lyrics}
                        onChange={(e) => setFormData({ ...formData, lyrics: e.target.value })}
                        placeholder="Enter song lyrics"
                        rows={12}
                        className="min-h-[200px] max-h-[400px]"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="choir"
                        checked={formData.isChoirPractice}
                        onChange={(e) => setFormData({ ...formData, isChoirPractice: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="choir">Add to choir practice</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="good-friday"
                        checked={formData.isGoodFridaySong}
                        onChange={(e) => setFormData({ ...formData, isGoodFridaySong: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="good-friday">Tag as Good Friday</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="christmas"
                        checked={formData.isChristmasSong}
                        onChange={(e) => setFormData({ ...formData, isChristmasSong: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="christmas">Tag as Christmas</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="church"
                        checked={formData.isChurchSong}
                        onChange={(e) => setFormData({ ...formData, isChurchSong: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="church">Tag as Church</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="youth"
                        checked={formData.isYouthSong}
                        onChange={(e) => setFormData({ ...formData, isYouthSong: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="youth">Tag as Youth</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="sundayschool"
                        checked={formData.isSundaySchoolSong}
                        onChange={(e) => setFormData({ ...formData, isSundaySchoolSong: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="sundayschool">Tag as SundaySchool</Label>
                    </div>
                  </div>
                </ScrollArea>
                <DialogFooter className="pt-4 border-t">
                  <Button onClick={handleSubmit}>
                    {editingSong ? 'Update Song' : 'Create Song'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Login Dialog */}
        <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
          <DialogContent className="login-dialog max-w-md" overlayClassName="modal-backdrop">
            <DialogHeader>
              <DialogTitle>Admin Login</DialogTitle>
              <DialogDescription>
                Enter your credentials to access admin features.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  placeholder="Enter username"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  placeholder="Enter password"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleLogin}>Login</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Duplicate Warning Dialog */}
        <AlertDialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Potential Duplicate Detected</AlertDialogTitle>
              <AlertDialogDescription>
                A song with a similar title already exists:
                <div className="mt-2 p-3 bg-muted rounded-lg">
                  <p className="font-semibold">{duplicateWarning?.title}</p>
                  <p className="text-sm text-muted-foreground">Language: {duplicateWarning?.songLanguage}</p>
                </div>
                Are you sure you want to create this song? This might result in duplicate entries.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowDuplicateDialog(false)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleCreateSongOverride}>Create Anyway</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Bulk Tag Dialog */}
        <Dialog open={showBulkTagDialog} onOpenChange={setShowBulkTagDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Tag {selectedSongIds.size} Song{selectedSongIds.size > 1 ? 's' : ''}</DialogTitle>
              <DialogDescription>
                Select tags to add or remove from the selected songs.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <p className="mb-2 text-sm font-medium">Add tags</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_TAGS.map((tag) => (
                    <Button
                      key={`add-${tag}`}
                      type="button"
                      variant={bulkTagAdd.includes(tag) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleBulkAddTag(tag)}
                    >
                      {tag === CHURCH_TAG && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-3.5 w-3.5 mr-1"><path d="M12 2v20" /><path d="M6.5 8.5h11" /></svg>}
                      {tag === YOUTH_TAG && <Star className="h-3.5 w-3.5 mr-1" />}
                      {tag === SUNDAY_SCHOOL_TAG && <BookOpen className="h-3.5 w-3.5 mr-1" />}
                      {tag === CHURCH_TAG ? 'Church' : tag === YOUTH_TAG ? 'Youth' : 'SundaySchool'}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Remove tags</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_TAGS.map((tag) => (
                    <Button
                      key={`remove-${tag}`}
                      type="button"
                      variant={bulkTagRemove.includes(tag) ? 'destructive' : 'outline'}
                      size="sm"
                      onClick={() => toggleBulkRemoveTag(tag)}
                    >
                      {tag === CHURCH_TAG && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-3.5 w-3.5 mr-1"><path d="M12 2v20" /><path d="M6.5 8.5h11" /></svg>}
                      {tag === YOUTH_TAG && <Star className="h-3.5 w-3.5 mr-1" />}
                      {tag === SUNDAY_SCHOOL_TAG && <BookOpen className="h-3.5 w-3.5 mr-1" />}
                      {tag === CHURCH_TAG ? 'Church' : tag === YOUTH_TAG ? 'Youth' : 'SundaySchool'}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setShowBulkTagDialog(false)}>Cancel</Button>
              <Button onClick={handleBulkTag}>Apply</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Tabs value={activeTab} onValueChange={setActiveTab} className={`w-full ${isGoodFridayTheme ? 'good-friday-tabs-shell' : ''}`}>
        <div className="sticky top-0 z-30 mb-4 w-full space-y-3 rounded-md bg-background/95 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:top-2 sm:mb-6">
        <div className={`flex w-full flex-col gap-3 sm:flex-row sm:gap-4 ${isGoodFridayTheme ? 'good-friday-controls' : ''}`}>
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <div className="absolute inset-y-0 right-2 flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSpeechLanguage((language) => language === 'en-IN' ? 'te-IN' : 'en-IN')}
                    className="h-7 px-1.5 text-[10px]"
                    aria-label={`Voice search language: ${speechLanguage === 'en-IN' ? 'English' : 'Telugu'}`}
                  >
                    {speechLanguage === 'en-IN' ? 'EN' : 'TE'}
                  </Button>
                  <button
                    type="button"
                    onClick={handleVoiceSearch}
                    className={`rounded-md p-1 transition-colors hover:bg-muted ${isListening ? 'text-destructive' : 'text-muted-foreground'}`}
                    aria-label={isListening ? 'Stop voice search' : 'Start voice search'}
                  >
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </button>
                {searchTerm && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                {isLoading && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              <Input
                ref={searchInputRef}
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`h-10 pl-10 pr-28 sm:h-11 ${isGoodFridayTheme ? 'good-friday-search-input' : ''}`}
              />
              <p className="mt-1 text-xs text-muted-foreground" aria-live="polite">
                {isLoading ? 'Searching...' : `${currentSongs.length} song${currentSongs.length === 1 ? '' : 's'} found`}
              </p>
            </div>
          </div>
          <div className={`flex w-full gap-2 sm:w-auto ${isGoodFridayTheme ? 'good-friday-filter-row' : ''}`}>
            <Select value={sortBy} onValueChange={(value: 'recent' | 'alphabetical') => setSortBy(value)}>
              <SelectTrigger className={`w-full sm:w-[180px] h-10 sm:h-11 ${isGoodFridayTheme ? 'good-friday-sort-trigger' : ''}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span className="hidden xs:inline">Most Recent</span>
                    <span className="xs:hidden">Recent</span>
                  </div>
                </SelectItem>
                <SelectItem value="alphabetical">
                  <div className="flex items-center gap-2">
                    <SortAsc className="h-4 w-4" />
                    <span className="hidden xs:inline">Alphabetical</span>
                    <span className="xs:hidden">Alpha</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            
            {/* Delete All button - only visible to admin */}
            {isAdmin && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className={`h-10 px-2 sm:h-11 sm:px-4 ${isGoodFridayTheme ? 'good-friday-delete-button' : ''}`}>
                    <Trash2 className="h-4 w-4 sm:mr-2" />
                    <span className="hidden xs:inline text-xs sm:text-sm">Delete All</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete all songs from the database.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAllSongs}>Delete All</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <p className="font-medium text-sm sm:text-base">Database Connection Error</p>
            </div>
            <p className="text-xs sm:text-sm text-destructive/80 mt-1">
              {error}
            </p>
            <p className="text-xs text-destructive/60 mt-2">
              Please make sure MongoDB is running and your connection string is correct.
            </p>
          </div>
        )}

        <TabsList className={`grid w-full grid-cols-4 min-h-10 h-auto p-1 max-[380px]:min-h-9 max-[380px]:p-0.5 sm:h-11 ${isGoodFridayTheme ? 'good-friday-tabs' : ''}`}>
          <TabsTrigger value="all-songs" className={`min-w-0 flex items-center justify-center gap-1 px-1 text-xs max-[380px]:gap-0 max-[380px]:px-0 max-[380px]:text-[10px] sm:gap-2 sm:px-2 sm:text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground ${isGoodFridayTheme ? 'good-friday-tab-trigger' : ''}`}>
            <List className="h-3.5 w-3.5 shrink-0 max-[380px]:h-3 max-[380px]:w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">{isGoodFridayTheme ? 'Songs' : 'All Songs'}</span>
            <span className="xs:hidden">Songs</span>
            <span className="text-xs opacity-80 max-[380px]:text-[10px]">({songCounts.all})</span>
          </TabsTrigger>
          <TabsTrigger value={CHOIR_TAB} className={`min-w-0 flex items-center justify-center gap-1 px-1 text-xs max-[380px]:gap-0 max-[380px]:px-0 max-[380px]:text-[10px] sm:gap-2 sm:px-2 sm:text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground ${isGoodFridayTheme ? 'good-friday-tab-trigger' : ''}`}>
            <Users className="h-3.5 w-3.5 shrink-0 max-[380px]:h-3 max-[380px]:w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">{isGoodFridayTheme ? 'Choir' : 'Choir Practice'}</span>
            <span className="xs:hidden">Choir</span>
            <span className="text-xs opacity-80 max-[380px]:text-[10px]">({songCounts.choir})</span>
          </TabsTrigger>
          <TabsTrigger value={GOOD_FRIDAY_TAB} className={`min-w-0 flex items-center justify-center gap-1 px-1 text-xs max-[380px]:gap-0 max-[380px]:px-0 max-[380px]:text-[10px] sm:gap-2 sm:px-2 sm:text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground ${isGoodFridayTheme ? 'good-friday-tab-trigger' : ''}`}>
            <Badge variant="secondary" className="hidden sm:inline-flex md:hidden">
              GF
            </Badge>
            <span className="hidden sm:inline">Good Friday</span>
            <span className="sm:hidden">GF</span>
            <span className="text-xs opacity-80 max-[380px]:text-[10px]">({songCounts.goodFriday})</span>
          </TabsTrigger>
          <TabsTrigger value={CHRISTMAS_TAB} className="min-w-0 flex items-center justify-center gap-1 px-1 text-xs max-[380px]:gap-0 max-[380px]:px-0 max-[380px]:text-[10px] sm:gap-2 sm:px-2 sm:text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <span className="hidden xs:inline">Christmas Songs</span>
            <span className="xs:hidden">Christmas</span>
            <span className="text-xs opacity-80 max-[380px]:text-[10px]">({songCounts.christmas})</span>
          </TabsTrigger>
        </TabsList>
        </div>

        <TabsContent value="all-songs" className="mt-4 sm:mt-6">
          <div className="mb-4 flex flex-wrap gap-2">
            {CATEGORY_TAGS.map((tag) => (
              <Button
                key={tag}
                type="button"
                variant={categoryFilter === tag ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCategoryFilter(categoryFilter === tag ? null : tag)}
                className="flex items-center gap-1.5"
              >
                {tag === CHURCH_TAG && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-3.5 w-3.5"><path d="M12 2v20" /><path d="M6.5 8.5h11" /></svg>}
                {tag === YOUTH_TAG && <Star className="h-3.5 w-3.5" />}
                {tag === SUNDAY_SCHOOL_TAG && <BookOpen className="h-3.5 w-3.5" />}
                {tag === CHURCH_TAG ? 'Church' : tag === YOUTH_TAG ? 'Youth' : 'SundaySchool'}
              </Button>
            ))}
            {categoryFilter && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setCategoryFilter(null)}
                className="text-muted-foreground"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Clear
              </Button>
            )}
          </div>
          <div className={`grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${isGoodFridayTheme ? 'good-friday-song-grid' : ''}`}>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <div key={`skeleton-${index}`} className="space-y-3">
                  <Skeleton className="h-48 w-full rounded-xl" />
                </div>
              ))
            ) : currentSongs === undefined ? (
              renderEmptyState('all-songs')
            ) : currentSongs.length === 0 ? (
              renderEmptyState('all-songs')
            ) : (
              currentSongs.map((song) => (
                <div key={song._id}>
                  <SongCard
                    song={song}
                    onEdit={handleEditSong}
                    onDelete={handleDeleteSong}
                    onToggleChoir={handleToggleChoir}
                    onViewDetails={handleViewDetails}
                    isAdmin={isAdmin}
                    searchTerm={searchTerm}
                    {...(isAdmin ? { selected: selectedSongIds.has(song._id), onToggleSelect: () => handleToggleSelectSong(song._id) } : {})}
                  />
                </div>
              ))
            )}
          </div>
          {selectedSongIds.size > 0 && isAdmin && (
            <div className="sticky bottom-4 z-40 mt-4 flex items-center justify-center gap-3 rounded-xl border bg-background/95 px-4 py-3 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80">
              <span className="text-sm text-muted-foreground">
                {selectedSongIds.size} song{selectedSongIds.size > 1 ? 's' : ''} selected
              </span>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleOpenBulkTagDialog}
              >
                Tag Selected
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearSelection}
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Clear
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value={GOOD_FRIDAY_TAB} className="mt-4 sm:mt-6">
          <div className={`grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${isGoodFridayTheme ? 'good-friday-song-grid' : ''}`}>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <div key={`skeleton-${index}`} className="space-y-3">
                  <Skeleton className="h-48 w-full rounded-xl" />
                </div>
              ))
            ) : currentSongs === undefined ? (
              renderEmptyState(GOOD_FRIDAY_TAB)
            ) : currentSongs.length === 0 ? (
              renderEmptyState(GOOD_FRIDAY_TAB)
            ) : (
              currentSongs.map((song) => (
                <div key={song._id}>
                  <SongCard
                    song={song}
                    onEdit={handleEditSong}
                    onDelete={handleDeleteSong}
                    onToggleChoir={handleToggleChoir}
                    onViewDetails={handleViewDetails}
                    isAdmin={isAdmin}
                    searchTerm={searchTerm}
                  />
                </div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value={CHRISTMAS_TAB} className="mt-4 sm:mt-6">
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <div key={`skeleton-${index}`} className="space-y-3">
                  <Skeleton className="h-48 w-full rounded-xl" />
                </div>
              ))
            ) : currentSongs === undefined ? (
              renderEmptyState(CHRISTMAS_TAB)
            ) : currentSongs.length === 0 ? (
              renderEmptyState(CHRISTMAS_TAB)
            ) : (
              currentSongs.map((song) => (
                <div key={song._id}>
                  <SongCard
                    song={song}
                    onEdit={handleEditSong}
                    onDelete={handleDeleteSong}
                    onToggleChoir={handleToggleChoir}
                    onViewDetails={handleViewDetails}
                    isAdmin={isAdmin}
                    searchTerm={searchTerm}
                  />
                </div>
              ))
            )}
          </div>
        </TabsContent>
        
        <TabsContent value={CHOIR_TAB} className="mt-4 sm:mt-6">
          <div className={`grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${isGoodFridayTheme ? 'good-friday-song-grid' : ''}`}>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <div key={`skeleton-${index}`} className="space-y-3">
                  <Skeleton className="h-48 w-full rounded-xl" />
                </div>
              ))
            ) : currentSongs === undefined ? (
              renderEmptyState(CHOIR_TAB)
            ) : currentSongs.length === 0 ? (
              renderEmptyState(CHOIR_TAB)
            ) : (
              currentSongs.map((song) => (
                <div key={song._id}>
                  <SongCard
                    song={song}
                    onEdit={handleEditSong}
                    onDelete={handleDeleteSong}
                    onToggleChoir={handleToggleChoir}
                    onViewDetails={handleViewDetails}
                    isAdmin={isAdmin} // Pass isAdmin prop
                    searchTerm={searchTerm}
                  />
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {showScrollTop && (
        <Button
          type="button"
          onClick={handleScrollToTop}
          size="icon"
          className={`fixed bottom-4 right-4 z-50 h-11 w-11 rounded-full shadow-lg sm:bottom-6 sm:right-6 ${
            isGoodFridayTheme ? 'good-friday-scroll-top' : ''
          }`}
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      )}
      </div>
    </div>
  );
}
