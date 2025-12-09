'use client';

import { useState, useEffect } from 'react';
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
import { Plus, Search, Music, Trash2, Edit, Users, List, Clock, SortAsc, AlertCircle, LogIn, LogOut, Snowflake, TreePine } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { PWAInstall } from '@/components/ui/pwa-install';
import { IOSInstall } from '@/components/ui/ios-install';

import { SongCard } from '@/components/ui/song-card';

interface Song {
  _id: string;
  title: string;
  songLanguage: string;
  lyrics: string;
  isChoirPractice: boolean;
  isChristmasSong?: boolean;
  createdAt: string;
  updatedAt: string;
}

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

// Function to detect potential duplicates
const detectDuplicates = (newSong: Omit<Song, '_id' | 'createdAt' | 'updatedAt'>, existingSongs: Song[]) => {
  const duplicates = existingSongs.filter(song => {
    // Check for exact title match
    if (song.title.toLowerCase().trim() === newSong.title.toLowerCase().trim()) {
      return true;
    }
    
    // Check for similar titles (Levenshtein distance < 3)
    const levenshteinDistance = (a: string, b: string): number => {
      if (a.length === 0) return b.length;
      if (b.length === 0) return a.length;
      
      const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
      
      for (let i = 0; i <= a.length; i++) {
        matrix[0][i] = i;
      }
      
      for (let j = 0; j <= b.length; j++) {
        matrix[j][0] = j;
      }
      
      for (let j = 1; j <= b.length; j++) {
        for (let i = 1; i <= a.length; i++) {
          const cost = a[i - 1] === b[j - 1] ? 0 : 1;
          matrix[j][i] = Math.min(
            matrix[j][i - 1] + 1, // insertion
            matrix[j - 1][i] + 1, // deletion
            matrix[j - 1][i - 1] + cost // substitution
          );
        }
      }
      
      return matrix[b.length][a.length];
    };
    
    // Check if titles are very similar
    const distance = levenshteinDistance(
      song.title.toLowerCase().trim(), 
      newSong.title.toLowerCase().trim()
    );
    
    return distance < 3;
  });
  
  return duplicates;
};

export default function Home() {
  const [activeTab, setActiveTab] = useState('all-songs');
  const [songs, setSongs] = useState<Song[]>([]);
  const [choirSongs, setChoirSongs] = useState<Song[]>([]);
  const [christmasSongs, setChristmasSongs] = useState<Song[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'alphabetical'>('recent');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    songLanguage: 'Telugu',
    lyrics: '',
    isChoirPractice: false,
    isChristmasSong: false
  });
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
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchSongs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        search: searchTerm,
        sortBy,
        ...(activeTab === 'choir-practice' && { choirOnly: 'true' }),
        ...(activeTab === 'christmas-songs' && { christmasOnly: 'true' })
      });
      
      const response = await fetch(`/api/songs?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        if (activeTab === 'choir-practice') {
          setChoirSongs(result.songs || []);
        } else if (activeTab === 'christmas-songs') {
          setChristmasSongs(result.songs || []);
        } else {
          setSongs(result.songs || []);
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

  const handleLogin = () => {
    // Check credentials (Admin User: Aj, Pass: MPH)
    if (loginForm.username === 'Aj' && loginForm.password === 'MPH') {
      setIsAdmin(true);
      setShowLoginDialog(false);
      setLoginForm({ username: '', password: '' });
    } else {
      alert('Invalid credentials. Please try again.');
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
  };

  const handleCreateSong = async () => {
    // Check for duplicates before creating
    const duplicates = detectDuplicates(formData, songs);
    if (duplicates.length > 0) {
      setDuplicateWarning(duplicates[0]);
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
        setFormData({ title: '', songLanguage: 'Telugu', lyrics: '', isChoirPractice: false, isChristmasSong: false });
        setIsDialogOpen(false);
        // Force refresh the song list to ensure UI updates
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to ensure DB update
        await fetchSongs();
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
        setFormData({ title: '', songLanguage: 'Telugu', lyrics: '', isChoirPractice: false, isChristmasSong: false });
        setIsDialogOpen(false);
        // Force refresh the song list to ensure UI updates
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to ensure DB update
        await fetchSongs();
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
        setFormData({ title: '', songLanguage: 'Telugu', lyrics: '', isChoirPractice: false, isChristmasSong: false });
        setIsDialogOpen(false);
        // Force refresh the song list to ensure UI updates
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to ensure DB update
        await fetchSongs();
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
        // Force refresh the song list to ensure UI updates
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to ensure DB update
        await fetchSongs();
      } else {
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
        // Force refresh the song list to ensure UI updates
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to ensure DB update
        await fetchSongs();
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
        // Force refresh the song list to ensure UI updates
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to ensure DB update
        await fetchSongs();
      }
    } catch (error) {
      console.error('Error toggling choir status:', error);
    }
  };

  const handleEditSong = (song: Song) => {
    setEditingSong(song);
    setFormData({
      title: song.title,
      songLanguage: song.songLanguage,
      lyrics: song.lyrics,
      isChoirPractice: song.isChoirPractice,
      isChristmasSong: song.isChristmasSong || false
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

  // Fetch songs when component mounts or when dependencies change
  useEffect(() => {
    fetchSongs();
  }, [activeTab, searchTerm, sortBy]);

  const currentSongs = activeTab === 'choir-practice' 
    ? choirSongs 
    : activeTab === 'christmas-songs' 
      ? christmasSongs 
      : songs;

  return (
    <div className="min-h-screen bg-background p-2 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
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
        
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 md:mb-8 gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Music className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Song Lyrics Manager</h1>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            {!isAppInstalled && (
              <>
                <PWAInstall />
                <IOSInstall />
              </>
            )}
            {isAdmin ? (
              <Button onClick={handleLogout} variant="outline" size="sm" className="h-8 px-2 sm:h-9 sm:px-3 md:h-10 md:px-4">
                <LogOut className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline text-xs sm:text-sm">Logout</span>
              </Button>
            ) : (
              <Button onClick={() => setShowLoginDialog(true)} variant="outline" size="sm" className="h-8 px-2 sm:h-9 sm:px-3 md:h-10 md:px-4">
                <LogIn className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline text-xs sm:text-sm">Admin Login</span>
              </Button>
            )}
            
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setDialogError(null);
                setEditingSong(null);
                setFormData({ title: '', songLanguage: 'Telugu', lyrics: '', isChoirPractice: false, isChristmasSong: false });
              }
            }}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setDialogError(null);
                  setEditingSong(null);
                  setFormData({ title: '', songLanguage: 'Telugu', lyrics: '', isChoirPractice: false, isChristmasSong: false });
                }} className="h-8 px-2 sm:h-9 sm:px-3 md:h-10 md:px-4">
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden xs:inline text-xs sm:text-sm">Add Song</span>
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
                        id="christmas"
                        checked={formData.isChristmasSong}
                        onChange={(e) => setFormData({ ...formData, isChristmasSong: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="christmas" className="flex items-center gap-1">
                        <TreePine className="h-4 w-4 text-green-600" />
                        Christmas Song
                      </Label>
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
          <DialogContent className="max-w-md">
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

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search songs by title or lyrics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 sm:h-11"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={(value: 'recent' | 'alphabetical') => setSortBy(value)}>
              <SelectTrigger className="w-[140px] sm:w-[180px] h-10 sm:h-11">
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
                  <Button variant="destructive" className="h-10 sm:h-11 px-2 sm:px-4">
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-10 sm:h-11">
          <TabsTrigger value="all-songs" className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <List className="h-4 w-4" />
            <span className="hidden xs:inline">Songs</span>
            <span className="xs:hidden">Songs</span>
          </TabsTrigger>
          <TabsTrigger value="choir-practice" className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <Users className="h-4 w-4" />
            <span className="hidden xs:inline">Choir</span>
            <span className="xs:hidden">Choir</span>
          </TabsTrigger>
          <TabsTrigger 
            value="christmas-songs" 
            className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm christmas-tab relative overflow-hidden"
          >
            <TreePine className="h-4 w-4 text-green-600" />
            <span className="hidden xs:inline">Christmas Songs</span>
            <span className="xs:hidden">Christmas</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all-songs" className="mt-4 sm:mt-6">
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              <div className="col-span-full text-center py-8">Loading songs...</div>
            ) : currentSongs === undefined ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No songs found. Create your first song to get started!
              </div>
            ) : currentSongs.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No songs found. Create your first song to get started!
              </div>
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
                  />
                </div>
              ))
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="choir-practice" className="mt-4 sm:mt-6">
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              <div className="col-span-full text-center py-8">Loading choir songs...</div>
            ) : currentSongs === undefined ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No choir practice songs found. Add songs to choir practice from the main list.
              </div>
            ) : currentSongs.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No choir practice songs found. Add songs to choir practice from the main list.
              </div>
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
                  />
                </div>
              ))
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="christmas-songs" className="mt-4 sm:mt-6">
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              <div className="col-span-full text-center py-8">Loading Christmas songs...</div>
            ) : christmasSongs === undefined ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                <TreePine className="h-12 w-12 mx-auto mb-4 text-green-600" />
                No Christmas songs found. Add a Christmas song to get started!
              </div>
            ) : christmasSongs.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                <TreePine className="h-12 w-12 mx-auto mb-4 text-green-600" />
                No Christmas songs found. Add a Christmas song to get started!
              </div>
            ) : (
              christmasSongs.map((song) => (
                <div key={song._id}>
                  <SongCard
                    song={song}
                    onEdit={handleEditSong}
                    onDelete={handleDeleteSong}
                    onToggleChoir={handleToggleChoir}
                    onViewDetails={handleViewDetails}
                    isAdmin={isAdmin}
                  />
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}