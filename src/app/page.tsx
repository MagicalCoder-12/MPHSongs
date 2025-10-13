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
import { Plus, Search, Music, Trash2, Edit, Users, List, Clock, SortAsc, AlertCircle, LogIn, LogOut } from 'lucide-react';

import { SongCard } from '@/components/ui/song-card';

interface Song {
  _id: string;
  title: string;
  songLanguage: string;
  lyrics: string;
  isChoirPractice: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('all-songs');
  const [songs, setSongs] = useState<Song[]>([]);
  const [choirSongs, setChoirSongs] = useState<Song[]>([]);
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
    isChoirPractice: false
  });
  // Admin authentication state
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });

   const fetchSongs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        search: searchTerm,
        sortBy,
        ...(activeTab === 'choir-practice' && { choirOnly: 'true' })
      });
      
      const response = await fetch(`/api/songs?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        if (activeTab === 'choir-practice') {
          setChoirSongs(result.songs || []);
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
    try {
      const response = await fetch('/api/songs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        setDialogError(null);
        setFormData({ title: '', songLanguage: 'Telugu', lyrics: '', isChoirPractice: false });
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
        setFormData({ title: '', songLanguage: 'Telugu', lyrics: '', isChoirPractice: false });
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
      isChoirPractice: song.isChoirPractice
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

  const currentSongs = activeTab === 'choir-practice' ? choirSongs : songs;

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-3">
            <Music className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Song Lyrics Manager</h1>
          </div>
          
          <div className="flex items-center gap-2">
            {isAdmin ? (
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            ) : (
              <Button onClick={() => setShowLoginDialog(true)} variant="outline" size="sm">
                <LogIn className="h-4 w-4 mr-2" />
                Admin Login
              </Button>
            )}
            
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setDialogError(null);
                setEditingSong(null);
                setFormData({ title: '', songLanguage: 'Telugu', lyrics: '', isChoirPractice: false });
              }
            }}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setDialogError(null);
                  setEditingSong(null);
                  setFormData({ title: '', songLanguage: 'Telugu', lyrics: '', isChoirPractice: false });
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Song
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

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search songs by title or lyrics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={(value: 'recent' | 'alphabetical') => setSortBy(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Most Recent
                  </div>
                </SelectItem>
                <SelectItem value="alphabetical">
                  <div className="flex items-center gap-2">
                    <SortAsc className="h-4 w-4" />
                    Alphabetical
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            
            {/* Delete All button - only visible to admin */}
            {isAdmin && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete All
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
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <p className="font-medium">Database Connection Error</p>
            </div>
            <p className="text-sm text-destructive/80 mt-1">
              {error}
            </p>
            <p className="text-xs text-destructive/60 mt-2">
              Please make sure MongoDB is running and your connection string is correct.
            </p>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all-songs" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            All Songs
          </TabsTrigger>
          <TabsTrigger value="choir-practice" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Choir Practice
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all-songs" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
        
        <TabsContent value="choir-practice" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
      </Tabs>
      </div>
    </div>
  );
}