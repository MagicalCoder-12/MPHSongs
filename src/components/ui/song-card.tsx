"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Users, Edit, Trash2 } from "lucide-react";

interface Song {
  _id: string;
  title: string;
  songLanguage: string;
  lyrics: string;
  isChoirPractice: boolean;
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCardClick = () => {
    setIsExpanded(!isExpanded);
  };

  const handleViewDetails = () => {
    setIsDialogOpen(true);
    onViewDetails(song);
  };

  return (
    <>
      <Card 
        className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
          isExpanded ? "scale-[1.02] shadow-xl border-primary" : "hover:shadow-md"
        }`}
        onClick={handleCardClick}
      >
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start gap-1">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base sm:text-lg truncate">{song.title}</CardTitle>
              <CardDescription>
                <div className="flex flex-wrap gap-1 mt-1">
                  <Badge variant="secondary" className="text-xs">{song.songLanguage}</Badge>
                  {song.isChoirPractice && (
                    <Badge variant="outline" className="text-xs">
                      <Users className="h-3 w-3 mr-1" />
                      Choir
                    </Badge>
                  )}
                </div>
              </CardDescription>
            </div>
            <div className="flex gap-0.5 sm:gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:h-9 sm:w-9"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(song);
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
              {/* Only show delete button if user is admin */}
              {isAdmin && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
        <CardContent className="pt-2">
          <ScrollArea className="h-32 sm:h-40 w-full">
            <p className="text-xs sm:text-sm whitespace-pre-wrap line-clamp-6">{song.lyrics}</p>
          </ScrollArea>
          <div className="flex flex-wrap gap-2 mt-3 sm:mt-4">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 min-w-[100px] h-8 sm:h-9 text-xs sm:text-sm"
              onClick={(e) => {
                e.stopPropagation();
                onToggleChoir(song);
              }}
            >
              {song.isChoirPractice ? 'Remove Choir' : 'Add Choir'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 min-w-[100px] h-8 sm:h-9 text-xs sm:text-sm"
              onClick={(e) => {
                e.stopPropagation();
                handleViewDetails();
              }}
            >
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl">{song.title}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="secondary">{song.songLanguage}</Badge>
            {song.isChoirPractice && (
              <Badge variant="outline">
                <Users className="h-3 w-3 mr-1" />
                Choir Practice
              </Badge>
            )}
          </div>
          <div className="mt-4">
            <p className="whitespace-pre-wrap text-base sm:text-lg leading-relaxed">{song.lyrics}</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}