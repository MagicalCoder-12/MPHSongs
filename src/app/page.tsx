'use client'

import { useState, useEffect, useRef } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Search, Music, Users, Upload, Eye, Trash2, AlertTriangle } from 'lucide-react'
import { Song } from '@/types/song'
import { useToast } from '@/hooks/use-toast'

export default function Home() {
  const [songs, setSongs] = useState<Song[]>([])
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newSong, setNewSong] = useState({
    title: '',
    artist: '',
    lyrics: '',
    language: 'English'
  })
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})
  const [selectedSong, setSelectedSong] = useState<Song | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [songToDelete, setSongToDelete] = useState<Song | null>(null)
  const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = useState(false)
  const { toast } = useToast()

  // Fetch songs from API
  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const response = await fetch('/api/songs')
        if (response.ok) {
          const data = await response.json()
          setSongs(data)
        }
      } catch (error) {
        console.error('Error fetching songs:', error)
      }
    }
    fetchSongs()
  }, [])

  // Filter songs based on search term and active tab
  useEffect(() => {
    let filtered = songs

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(song => 
        song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        song.artist?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        song.lyrics.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by tab
    if (activeTab === 'choir') {
      filtered = filtered.filter(song => song.inChoirPractice)
    }

    // Sort by title (ascending order)
    filtered = filtered.sort((a, b) => a.title.localeCompare(b.title))

    setFilteredSongs(filtered)
  }, [songs, searchTerm, activeTab])

  const newSongs = songs.filter(song => song.isNew)

  const handleAddSong = async () => {
    if (newSong.title && newSong.lyrics) {
      try {
        const response = await fetch('/api/songs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newSong),
        })

        if (response.ok) {
          const createdSong = await response.json()
          setSongs([createdSong, ...songs])
          setNewSong({ title: '', artist: '', lyrics: '', language: 'English' })
          setIsAddDialogOpen(false)
          toast({
            title: "Song added successfully",
            description: `"${createdSong.title}" has been added to your collection.`,
          })
        } else {
          console.error('Failed to create song')
          toast({
            title: "Failed to add song",
            description: "Could not add the song. Please try again.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error('Error creating song:', error)
        toast({
          title: "Error adding song",
          description: "An error occurred while adding the song.",
          variant: "destructive",
        })
      }
    }
  }

  const toggleChoirPractice = async (songId: string) => {
    try {
      const song = songs.find(s => s.id === songId)
      if (!song) return

      const response = await fetch(`/api/songs/${songId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inChoirPractice: !song.inChoirPractice
        }),
      })

      if (response.ok) {
        const updatedSong = await response.json()
        setSongs(songs.map(s => s.id === songId ? updatedSong : s))
        toast({
          title: updatedSong.inChoirPractice ? "Added to practice" : "Removed from practice",
          description: `"${updatedSong.title}" has been ${updatedSong.inChoirPractice ? 'added to' : 'removed from'} choir practice.`,
        })
      } else {
        console.error('Failed to update song')
        toast({
          title: "Failed to update",
          description: "Could not update the song. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error updating song:', error)
      toast({
        title: "Error updating song",
        description: "An error occurred while updating the song.",
        variant: "destructive",
      })
    }
  }

  const handleImageUpload = async (songId: string, file: File) => {
    try {
      const formData = new FormData()
      formData.append('image', file)
      formData.append('songId', songId)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        // Update the song with the new image URL
        setSongs(songs.map(s => s.id === songId ? { ...s, imageUrl: data.imageUrl } : s))
        toast({
          title: "Image uploaded successfully",
          description: "The screenshot has been added to your song.",
        })
      } else {
        const errorData = await response.json()
        console.error('Failed to upload image:', errorData.error)
        toast({
          title: "Upload failed",
          description: errorData.error || "Failed to upload image. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      toast({
        title: "Upload error",
        description: "An error occurred while uploading the image. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleFileInputChange = (songId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleImageUpload(songId, file)
    }
  }

  const triggerFileInput = (songId: string) => {
    const fileInput = fileInputRefs.current[songId]
    if (fileInput) {
      fileInput.click()
    }
  }

  const handleViewSong = (song: Song) => {
    setSelectedSong(song)
    setIsViewDialogOpen(true)
  }

  const handleDeleteSong = async (songId: string) => {
    try {
      const response = await fetch(`/api/songs/${songId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setSongs(songs.filter(song => song.id !== songId))
        toast({
          title: "Song deleted",
          description: "The song has been removed from your collection.",
        })
      } else {
        console.error('Failed to delete song')
        toast({
          title: "Failed to delete",
          description: "Could not delete the song. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error deleting song:', error)
      toast({
        title: "Error deleting song",
        description: "An error occurred while deleting the song.",
        variant: "destructive",
      })
    }
    setSongToDelete(null)
  }

  const handleDeleteAllSongs = async () => {
    try {
      const response = await fetch('/api/songs', {
        method: 'DELETE',
      })

      if (response.ok) {
        const data = await response.json()
        setSongs([])
        toast({
          title: "All songs deleted",
          description: `${data.count} songs have been removed from your collection.`,
        })
      } else {
        console.error('Failed to delete all songs')
        toast({
          title: "Failed to delete all",
          description: "Could not delete all songs. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error deleting all songs:', error)
      toast({
        title: "Error deleting all songs",
        description: "An error occurred while deleting all songs.",
        variant: "destructive",
      })
    }
    setIsDeleteAllDialogOpen(false)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Music className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Song Lyrics Manager</h1>
            </div>
            <div className="flex items-center gap-2">
              {songs.length > 0 && (
                <AlertDialog open={isDeleteAllDialogOpen} onOpenChange={setIsDeleteAllDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete All
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        Delete All Songs
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete all {songs.length} songs? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteAllSongs} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete All Songs
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Song
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Song</DialogTitle>
                  <DialogDescription>
                    Add a new song to your lyrics collection
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={newSong.title}
                      onChange={(e) => setNewSong({ ...newSong, title: e.target.value })}
                      placeholder="Enter song title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="artist">Artist</Label>
                    <Input
                      id="artist"
                      value={newSong.artist}
                      onChange={(e) => setNewSong({ ...newSong, artist: e.target.value })}
                      placeholder="Enter artist name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="language">Language</Label>
                    <Select value={newSong.language} onValueChange={(value) => setNewSong({ ...newSong, language: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="English">English</SelectItem>
                        <SelectItem value="Spanish">Spanish</SelectItem>
                        <SelectItem value="French">French</SelectItem>
                        <SelectItem value="German">German</SelectItem>
                        <SelectItem value="Italian">Italian</SelectItem>
                        <SelectItem value="Portuguese">Portuguese</SelectItem>
                        <SelectItem value="Chinese">Chinese</SelectItem>
                        <SelectItem value="Japanese">Japanese</SelectItem>
                        <SelectItem value="Korean">Korean</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="lyrics">Lyrics</Label>
                    <Textarea
                      id="lyrics"
                      value={newSong.lyrics}
                      onChange={(e) => setNewSong({ ...newSong, lyrics: e.target.value })}
                      placeholder="Enter song lyrics"
                      rows={6}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddSong}>
                      Add Song
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* New Songs Bar */}
        {newSongs.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                New
              </Badge>
              Latest Songs
            </h2>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {newSongs.map((song) => (
                <Card key={song.id} className="min-w-[200px] flex-shrink-0">
                  <CardContent className="p-4">
                    <h3 className="font-medium text-sm">{song.title}</h3>
                    <p className="text-xs text-muted-foreground">{song.artist}</p>
                    <Badge variant="outline" className="mt-2 text-xs">
                      {song.language}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search songs by title, artist, or lyrics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Music className="h-4 w-4" />
              All Songs ({songs.length})
            </TabsTrigger>
            <TabsTrigger value="choir" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Choir Practice ({songs.filter(s => s.inChoirPractice).length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {filteredSongs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No songs found. Add your first song to get started!
                  </div>
                ) : (
                  filteredSongs.map((song) => (
                    <Card key={song.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{song.title}</CardTitle>
                            <CardDescription>{song.artist}</CardDescription>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant="outline">{song.language}</Badge>
                            {song.isNew && (
                              <Badge className="bg-green-100 text-green-800">New</Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="whitespace-pre-wrap text-sm leading-relaxed">
                            {song.lyrics}
                          </div>
                          <div className="flex justify-between items-center gap-2 flex-wrap">
                            <Button
                              variant={song.inChoirPractice ? "default" : "outline"}
                              size="sm"
                              onClick={() => toggleChoirPractice(song.id)}
                            >
                              <Users className="h-4 w-4 mr-2" />
                              {song.inChoirPractice ? "In Practice" : "Add to Practice"}
                            </Button>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => triggerFileInput(song.id)}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Import Screenshot
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleViewSong(song)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Button>
                              <AlertDialog open={songToDelete?.id === song.id} onOpenChange={(open) => !open && setSongToDelete(null)}>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setSongToDelete(song)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="flex items-center gap-2">
                                      <AlertTriangle className="h-5 w-5 text-destructive" />
                                      Delete Song
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{song.title}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteSong(song.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                      Delete Song
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                            <input
                              ref={(el) => fileInputRefs.current[song.id] = el}
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileInputChange(song.id, e)}
                              className="hidden"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="choir" className="mt-6">
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {filteredSongs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No songs in choir practice. Add songs from the All Songs tab!
                  </div>
                ) : (
                  filteredSongs.map((song) => (
                    <Card key={song.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{song.title}</CardTitle>
                            <CardDescription>{song.artist}</CardDescription>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant="outline">{song.language}</Badge>
                            {song.isNew && (
                              <Badge className="bg-green-100 text-green-800">New</Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="whitespace-pre-wrap text-sm leading-relaxed">
                            {song.lyrics}
                          </div>
                          <div className="flex justify-between items-center gap-2 flex-wrap">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => toggleChoirPractice(song.id)}
                            >
                              <Users className="h-4 w-4 mr-2" />
                              Remove from Practice
                            </Button>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => triggerFileInput(song.id)}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Import Screenshot
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleViewSong(song)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Button>
                              <AlertDialog open={songToDelete?.id === song.id} onOpenChange={(open) => !open && setSongToDelete(null)}>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setSongToDelete(song)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="flex items-center gap-2">
                                      <AlertTriangle className="h-5 w-5 text-destructive" />
                                      Delete Song
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{song.title}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteSong(song.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                      Delete Song
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                            <input
                              ref={(el) => fileInputRefs.current[song.id] = el}
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileInputChange(song.id, e)}
                              className="hidden"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      {/* Song Detail View Modal */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-2xl">{selectedSong?.title}</DialogTitle>
                <DialogDescription className="text-lg mt-1">
                  {selectedSong?.artist}
                </DialogDescription>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">{selectedSong?.language}</Badge>
                {selectedSong?.isNew && (
                  <Badge className="bg-green-100 text-green-800">New</Badge>
                )}
                {selectedSong?.inChoirPractice && (
                  <Badge className="bg-blue-100 text-blue-800">In Practice</Badge>
                )}
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Image Section */}
            {selectedSong?.imageUrl && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Lyrics Image</h3>
                <div className="border rounded-lg overflow-hidden">
                  <img
                    src={selectedSong.imageUrl}
                    alt={`${selectedSong.title} lyrics`}
                    className="w-full h-auto max-h-[500px] object-contain"
                    onError={(e) => {
                      console.error('Image failed to load:', selectedSong.imageUrl)
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Text Lyrics Section */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Lyrics Text</h3>
              <div className="border rounded-lg p-4 bg-muted/50">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {selectedSong?.lyrics || 'No lyrics text available'}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-4 border-t">
              <Button
                variant={selectedSong?.inChoirPractice ? "default" : "outline"}
                onClick={() => {
                  if (selectedSong) {
                    toggleChoirPractice(selectedSong.id)
                  }
                }}
              >
                <Users className="h-4 w-4 mr-2" />
                {selectedSong?.inChoirPractice ? "Remove from Practice" : "Add to Practice"}
              </Button>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => {
                    if (selectedSong) {
                      triggerFileInput(selectedSong.id)
                    }
                  }}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Replace Screenshot
                </Button>
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}