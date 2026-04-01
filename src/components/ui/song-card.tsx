"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Users, Edit, Trash2, TreePine } from "lucide-react";
import { GOOD_FRIDAY_TAG } from "@/lib/song-tags";

interface Song {
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

interface SongCardProps {
  song: Song;
  onEdit: (song: Song) => void;
  onDelete: (id: string) => void;
  onToggleChoir: (song: Song) => void;
  onViewDetails: (song: Song) => void;
  isAdmin?: boolean; // Added isAdmin prop to control delete visibility
}

export function SongCard({ 
  song, 
  onEdit, 
  onDelete, 
  onToggleChoir, 
  onViewDetails,
  isAdmin = false, // Default to false
}: SongCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const isGoodFridaySong = song.tags?.includes(GOOD_FRIDAY_TAG);

  const handleCardClick = () => {
    handleViewDetails();
  };

  const handleViewDetails = () => {
    setIsDialogOpen(true);
    onViewDetails(song);
  };

  return (
    <>
      <Card 
        className="leather-card easter-card song-card-shell cursor-pointer transition-all duration-300 hover:shadow-2xl border-none overflow-hidden"
        onClick={handleCardClick}
      >
        <CardHeader className="song-card-header pb-2 relative z-10">
          <div className="flex justify-between items-start gap-1">
            <div className="min-w-0 flex-1">
              <CardTitle className="song-card-title song-title text-base sm:text-lg truncate font-[family:var(--font-playfair)] text-foreground">{song.title}</CardTitle>
              <CardDescription className="song-card-meta">
                <div className="flex flex-wrap gap-1 mt-1">
                  <span className="beige-chip easter-chip text-xs">{song.songLanguage}</span>
                  {song.isChoirPractice && (
                    <span className="beige-chip easter-chip text-xs flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Choir
                    </span>
                  )}
                  {song.isChristmasSong && (
                    <span className="beige-chip easter-chip text-xs flex items-center gap-1">
                      <TreePine className="h-3 w-3 text-green-700" />
                      Christmas
                    </span>
                  )}
                  {isGoodFridaySong && (
                    <Badge variant="secondary" className="text-xs">
                      Good Friday
                    </Badge>
                  )}
                </div>
              </CardDescription>
            </div>
            <div className="song-card-edit-actions flex gap-0.5 sm:gap-1">
              <button
                className="gold-icon-btn !w-8 !h-8 sm:!w-9 sm:!h-9"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(song);
                }}
                aria-label="Edit song"
              >
                <Edit className="h-4 w-4" />
              </button>
              {isAdmin && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="gold-icon-btn !w-8 !h-8 sm:!w-9 sm:!h-9" aria-label="Delete song">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent aria-describedby={undefined}>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Song</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{song.title}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDelete(song._id)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="song-card-content pt-2 relative z-10">
          <ScrollArea className="song-card-content song-content h-32 sm:h-40 w-full">
            <p className="song-card-lyrics song-lyrics text-xs sm:text-sm whitespace-pre-wrap line-clamp-6 text-foreground">{song.lyrics}</p>
          </ScrollArea>
          <div className="song-card-actions flex flex-wrap gap-2 mt-3 sm:mt-4">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onToggleChoir(song);
              }}
              className="neomorph-button song-card-primary-action flex-1 min-w-[100px] h-8 sm:h-9 text-xs sm:text-sm bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {song.isChoirPractice ? 'Remove Choir' : 'Add Choir'}
            </Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleViewDetails();
              }}
              className="neomorph-button song-card-secondary-action flex-1 min-w-[100px] h-8 sm:h-9 text-xs sm:text-sm bg-secondary text-secondary-foreground hover:bg-secondary/80"
            >
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto neomorph-raised" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="song-dialog-title song-title text-xl sm:text-2xl font-serif text-foreground">{song.title}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="beige-chip easter-chip">{song.songLanguage}</span>
            {song.isChoirPractice && (
              <span className="beige-chip easter-chip flex items-center gap-1">
                <Users className="h-3 w-3" />
                Choir Practice
              </span>
            )}
            {song.isChristmasSong && (
              <span className="beige-chip easter-chip flex items-center gap-1">
                <TreePine className="h-3 w-3 text-green-700" />
                Christmas Song
              </span>
            )}
            {isGoodFridaySong && (
              <Badge variant="secondary">Good Friday</Badge>
            )}
          </div>
          <div className="mt-4">
            <p className="song-dialog-lyrics song-lyrics whitespace-pre-wrap text-base sm:text-lg leading-relaxed font-sans max-h-96 overflow-y-auto p-2 rounded bg-muted">{song.lyrics}</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
