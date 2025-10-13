'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Share, PlusSquare } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export function IOSInstall() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if it's iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);
    
    // Check if it's already installed
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window as any).navigator.standalone;
    setIsStandalone(isStandaloneMode);
  }, []);

  if (!isIOS || isStandalone) {
    return null;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Install App
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Install on iPhone/iPad</DialogTitle>
          <DialogDescription>
            Add this app to your home screen for quick access and offline functionality.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="flex items-center gap-2">
            <Share className="h-5 w-5 text-primary" />
            <span>1. Tap the Share button</span>
          </div>
          <div className="flex items-center gap-2">
            <PlusSquare className="h-5 w-5 text-primary" />
            <span>2. Select "Add to Home Screen"</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white text-xs">+</div>
            <span>3. Tap "Add"</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}