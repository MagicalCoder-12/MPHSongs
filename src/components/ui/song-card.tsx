"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, Download, Edit, Trash2 } from "lucide-react";

interface Song {
  _id: string;
  title: string;
  language: string;
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
  onScreenshot: (song: Song) => void;
  onViewDetails: (song: Song) => void;
}

export function SongCard({ 
  song, 
  onEdit, 
  onDelete, 
  onToggleChoir, 
  onScreenshot,
  onViewDetails
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
          isExpanded ? "scale-105 shadow-xl border-primary" : "hover:shadow-md"
        }`}
        onClick={handleCardClick}
      >
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">{song.title}</CardTitle>
              <CardDescription>
                <div className="flex flex-wrap gap-1 mt-1">
                  <Badge variant="secondary">{song.language}</Badge>
                  {song.isChoirPractice && (
                    <Badge variant="outline">
                      <Users className="h-3 w-3 mr-1" />
                      Choir
                    </Badge>
                  )}
                </div>
              </CardDescription>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(song);
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onScreenshot(song);
                }}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-40 w-full">
            <p className="text-sm whitespace-pre-wrap">{song.lyrics}</p>
          </ScrollArea>
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onToggleChoir(song);
              }}
            >
              {song.isChoirPractice ? 'Remove from Choir' : 'Add to Choir'}
            </Button>
            <Button
              variant="outline"
              size="sm"
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
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{song.title}</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2 mb-4">
            <Badge variant="secondary">{song.language}</Badge>
            {song.isChoirPractice && (
              <Badge variant="outline">
                <Users className="h-3 w-3 mr-1" />
                Choir Practice
              </Badge>
            )}
          </div>
          <div className="mt-4">
            <p className="whitespace-pre-wrap text-lg leading-relaxed">{song.lyrics}</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}