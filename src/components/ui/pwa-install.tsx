'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export function PWAInstall() {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if it's iOS (which has different installation process)
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);
    
    // Check if it's already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    const handler = (e: Event) => {
      // Remove e.preventDefault() to allow the banner to show
      setSupportsPWA(true);
      setPromptInstall(e);
    };

    window.addEventListener('beforeinstallprompt', handler as any);

    return () => window.removeEventListener('beforeinstallprompt', handler as any);
  }, []);

  const onClick = async (evt: React.MouseEvent) => {
    evt.preventDefault();
    if (!promptInstall) {
      return;
    }
    
    // Show the install prompt
    (promptInstall as any).prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await (promptInstall as any).userChoice;
    
    // If user installs the app
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    // Clear the saved prompt since it can't be used again
    setPromptInstall(null);
    setSupportsPWA(false);
  };

  // Don't show on iOS or if already installed
  if (isIOS || !supportsPWA) {
    return null;
  }

  return (
    <Button onClick={onClick} variant="outline" size="sm">
      <Download className="h-4 w-4 mr-2" />
      Install App
    </Button>
  );
}