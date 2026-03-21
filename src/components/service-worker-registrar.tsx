'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      return;
    }

    if ('serviceWorker' in navigator) {
      const registerServiceWorker = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          await registration.update();
          console.log('Service Worker registered with scope:', registration.scope);
        } catch (error) {
          console.log('Service Worker registration failed:', error);
        }
      };

      // Register service worker when the page loads
      if (document.readyState === 'complete') {
        registerServiceWorker();
      } else {
        window.addEventListener('load', registerServiceWorker);

        return () => {
          window.removeEventListener('load', registerServiceWorker);
        };
      }
    }
  }, []);

  return null;
}
