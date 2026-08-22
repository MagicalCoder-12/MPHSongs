"use client";

import { useRef, useState, useCallback, type KeyboardEvent, type TouchEvent, type TouchList } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Users, Edit, Trash2, TreePine, Star, BookOpen, ZoomIn, ZoomOut, RotateCcw, Check, Share2, Copy, Maximize2, Minimize2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GOOD_FRIDAY_TAG, CHURCH_TAG, YOUTH_TAG, SUNDAY_SCHOOL_TAG } from "@/lib/song-tags";
import type { Song } from "@/lib/types";

interface SongCardProps {
  song: Song;
  onEdit: (song: Song) => void;
  onDelete: (id: string) => void;
  onToggleChoir: (song: Song) => void;
  onViewDetails: (song: Song) => void;
  isAdmin?: boolean;
  searchTerm?: string;
  selected?: boolean;
  onToggleSelect?: () => void;
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const renderHighlightedText = (text: string, searchTerm: string) => {
  const trimmedSearchTerm = searchTerm.trim();

  if (!trimmedSearchTerm) {
    return text;
  }

  const parts = text.split(new RegExp(`(${escapeRegExp(trimmedSearchTerm)})`, 'gi'));

  return parts.map((part, index) =>
    part.toLowerCase() === trimmedSearchTerm.toLowerCase() ? (
      <mark key={`${part}-${index}`} className="rounded bg-yellow-200 px-0.5 text-yellow-950">
        {part}
      </mark>
    ) : (
      part
    )
  );
};

export function SongCard({ 
  song, 
  onEdit, 
  onDelete, 
  onToggleChoir, 
  onViewDetails,
  isAdmin = false,
  searchTerm = '',
  selected,
  onToggleSelect,
}: SongCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lyricsZoom, setLyricsZoom] = useState(1);
  const { toast } = useToast();
  const pinchStartDistanceRef = useRef<number | null>(null);
  const pinchStartZoomRef = useRef(1);
  const isGoodFridaySong = song.tags?.includes(GOOD_FRIDAY_TAG);
  const isChurchSong = song.tags?.includes(CHURCH_TAG);
  const isYouthSong = song.tags?.includes(YOUTH_TAG);
  const isSundaySchoolSong = song.tags?.includes(SUNDAY_SCHOOL_TAG);
  const lyricsFontSize = `${lyricsZoom}rem`;
  const lyricsLineHeight = lyricsZoom >= 1.4 ? 1.65 : 1.75;

  const clampLyricsZoom = (value: number) => Math.min(1.75, Math.max(0.85, Number(value.toFixed(2))));

  const adjustLyricsZoom = (amount: number) => {
    setLyricsZoom((currentZoom) => clampLyricsZoom(currentZoom + amount));
  };

  const getTouchDistance = (touches: TouchList) => {
    const firstTouch = touches[0];
    const secondTouch = touches[1];
    const deltaX = firstTouch.clientX - secondTouch.clientX;
    const deltaY = firstTouch.clientY - secondTouch.clientY;

    return Math.hypot(deltaX, deltaY);
  };

  const handleLyricsTouchStart = (event: TouchEvent<HTMLParagraphElement>) => {
    if (event.touches.length !== 2) {
      return;
    }

    pinchStartDistanceRef.current = getTouchDistance(event.touches);
    pinchStartZoomRef.current = lyricsZoom;
  };

  const handleLyricsTouchMove = (event: TouchEvent<HTMLParagraphElement>) => {
    if (event.touches.length !== 2 || !pinchStartDistanceRef.current) {
      return;
    }

    event.preventDefault();
    const currentDistance = getTouchDistance(event.touches);
    const nextZoom = pinchStartZoomRef.current * (currentDistance / pinchStartDistanceRef.current);
    setLyricsZoom(clampLyricsZoom(nextZoom));
  };

  const handleLyricsTouchEnd = () => {
    pinchStartDistanceRef.current = null;
  };

  const handleCardClick = () => {
    if (onToggleSelect) {
      onToggleSelect();
    } else {
      handleViewDetails();
    }
  };

  const handleCardKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    const cards = Array.from(document.querySelectorAll<HTMLElement>('[data-song-card]'));
    const currentIndex = cards.indexOf(event.currentTarget);
    const nextIndex = event.key === 'ArrowDown' ? currentIndex + 1 : currentIndex - 1;
    const nextCard = cards[nextIndex];
    if (nextCard) {
      event.preventDefault();
      nextCard.focus();
    }
  };

  const handleViewDetails = () => {
    setIsDialogOpen(true);
    onViewDetails(song);
  };

  const handleCopyLyrics = async () => {
    try {
      await navigator.clipboard.writeText(song.lyrics);
      toast({ title: "Lyrics copied", description: "The lyrics are ready to paste." });
    } catch {
      toast({ title: "Copy failed", description: "Unable to copy lyrics on this device." });
    }
  };

  const handleShareSong = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: song.title,
          text: song.subtitle ? `${song.title} — ${song.subtitle}` : song.title,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(`${song.title}${song.subtitle ? ` — ${song.subtitle}` : ''}`);
      }
      toast({ title: "Song shared", description: "The song link or title is ready to share." });
    } catch {
      toast({ title: "Share cancelled", description: "The song was not shared." });
    }
  };

  return (
    <>
      <Card 
        data-song-card="true"
        tabIndex={0}
        className={`leather-card song-card-shell h-full cursor-pointer transition-all duration-300 hover:shadow-2xl border-none overflow-hidden relative ${selected ? 'ring-2 ring-primary' : ''}`}
        onClick={handleCardClick}
        onKeyDown={handleCardKeyDown}
      >
        {onToggleSelect && (
          <div
            className="absolute left-2 top-2 z-20"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onToggleSelect}
              className={`flex h-5 w-5 items-center justify-center rounded border ${
                selected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-muted-foreground/40 bg-background/80'
              }`}
              aria-label={selected ? 'Deselect song' : 'Select song'}
            >
              {selected && <Check className="h-3 w-3" />}
            </button>
          </div>
        )}
        <CardHeader className="song-card-header pb-2 relative z-10">
          <div className="flex justify-between items-start gap-1">
            <div className="min-w-0 flex-1">
              <CardTitle className="song-card-title song-title text-base sm:text-lg font-[family:var(--font-playfair)] text-foreground">
                {renderHighlightedText(song.title, searchTerm)}
                {song.subtitle && (
                  <span className="block text-xs sm:text-sm font-normal text-muted-foreground mt-0.5">
                    {renderHighlightedText(song.subtitle, searchTerm)}
                  </span>
                )}
              </CardTitle>
              <CardDescription className="song-card-meta">
                <div className="flex flex-wrap gap-1 mt-1">
                  <span className="beige-chip text-xs">{song.songLanguage}</span>
                  {song.isChoirPractice && (
                    <span className="beige-chip text-xs flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Choir
                    </span>
                  )}
                  {song.isChristmasSong && (
                    <span className="beige-chip text-xs flex items-center gap-1">
                      <TreePine className="h-3 w-3 text-green-700" />
                      Christmas
                    </span>
                  )}
                  {isGoodFridaySong && (
                    <Badge variant="secondary" className="text-xs">
                      Good Friday
                    </Badge>
                  )}
                  {isChurchSong && (
                    <span className="beige-chip text-xs flex items-center gap-1">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-3 w-3"><path d="M12 2v20" /><path d="M6.5 8.5h11" /></svg>
                      Church
                    </span>
                  )}
                  {isYouthSong && (
                    <span className="beige-chip text-xs flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      Youth
                    </span>
                  )}
                  {isSundaySchoolSong && (
                    <span className="beige-chip text-xs flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      SundaySchool
                    </span>
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
         <CardContent className="song-card-content relative z-10">
           <ScrollArea className="song-card-content song-content h-24 sm:h-35 w-full">
             <p className="song-card-lyrics song-lyrics text-xs sm:text-sm whitespace-pre-wrap line-clamp-6 text-foreground">
               {renderHighlightedText(song.lyrics, searchTerm)}
             </p>
           </ScrollArea>
           <p className="mt-1 text-xs text-muted-foreground">Updated {new Date(song.updatedAt).toLocaleDateString()}</p>
           <div className="song-card-actions flex flex-wrap gap-2 mt-0">
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
             <Button
               onClick={(e) => {
                 e.stopPropagation();
                 void handleShareSong();
               }}
               className="neomorph-button song-card-action h-8 sm:h-9 text-xs sm:text-sm bg-secondary text-secondary-foreground hover:bg-secondary/80"
               aria-label="Share song"
             >
               <Share2 className="h-3.5 w-3.5 sm:mr-1" />
               <span className="hidden sm:inline">Share</span>
             </Button>
             <Button
               onClick={(e) => {
                 e.stopPropagation();
                 void handleCopyLyrics();
               }}
               className="neomorph-button song-card-action h-8 sm:h-9 text-xs sm:text-sm bg-secondary text-secondary-foreground hover:bg-secondary/80"
               aria-label="Copy lyrics"
             >
               <Copy className="h-3.5 w-3.5 sm:mr-1" />
               <span className="hidden sm:inline">Copy</span>
             </Button>
           </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) setIsFullscreen(false);
      }}>
        <DialogContent className={`${isFullscreen ? 'fixed inset-0 h-screen w-screen max-h-screen max-w-none rounded-none p-4 sm:p-6' : 'w-[95vw] max-w-7xl max-h-[96vh] pb-[15px]'} overflow-y-auto neomorph-raised`}>
          <DialogHeader>
            <DialogTitle className="song-dialog-title song-title text-xl sm:text-2xl font-serif text-foreground">
              {renderHighlightedText(song.title, searchTerm)}
              {song.subtitle && (
                <span className="block text-sm sm:text-base font-normal text-muted-foreground mt-1">
                  {renderHighlightedText(song.subtitle, searchTerm)}
                </span>
              )}
            </DialogTitle>
            <DialogDescription className="sr-only">Lyrics and song details for {song.title}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-2 mb-0 -mt-2">
            <span className="beige-chip">{song.songLanguage}</span>
            {song.isChoirPractice && (
              <span className="beige-chip flex items-center gap-1">
                <Users className="h-3 w-3" />
                Choir Practice
              </span>
            )}
            {song.isChristmasSong && (
              <span className="beige-chip flex items-center gap-1">
                <TreePine className="h-3 w-3 text-green-700" />
                Christmas Song
              </span>
            )}
            {isGoodFridaySong && (
              <Badge variant="secondary">Good Friday</Badge>
            )}
            {isChurchSong && (
              <span className="beige-chip flex items-center gap-1">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-3 w-3"><path d="M12 2v20" /><path d="M6.5 8.5h11" /></svg>
                Church
              </span>
            )}
            {isYouthSong && (
              <span className="beige-chip flex items-center gap-1">
                <Star className="h-3 w-3" />
                Youth
              </span>
            )}
            {isSundaySchoolSong && (
              <span className="beige-chip flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                SundaySchool
              </span>
            )}
          </div>
          <div className="song-content -mt-3">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-muted-foreground">Lyrics size</p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => adjustLyricsZoom(-0.1)}
                  disabled={lyricsZoom <= 0.85}
                  aria-label="Zoom lyrics out"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="min-w-12 text-center text-sm text-muted-foreground">
                  {Math.round(lyricsZoom * 100)}%
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => adjustLyricsZoom(0.1)}
                  disabled={lyricsZoom >= 1.75}
                  aria-label="Zoom lyrics in"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setLyricsZoom(1)}
                  disabled={lyricsZoom === 1}
                  aria-label="Reset lyrics zoom"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFullscreen((current) => !current)}
                  aria-label={isFullscreen ? "Exit full-screen lyrics" : "Open full-screen lyrics"}
                >
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <p
              className="song-dialog-lyrics song-lyrics whitespace-pre-wrap font-sans max-h-[460px] w-full overflow-y-auto p-2 pr-4 rounded bg-muted"
              style={{ fontSize: lyricsFontSize, lineHeight: lyricsLineHeight, touchAction: "pan-y" }}
              onTouchStart={handleLyricsTouchStart}
              onTouchMove={handleLyricsTouchMove}
              onTouchEnd={handleLyricsTouchEnd}
              onTouchCancel={handleLyricsTouchEnd}
            >
              {renderHighlightedText(song.lyrics, searchTerm)}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
