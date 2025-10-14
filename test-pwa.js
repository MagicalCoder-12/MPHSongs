// Test PWA functionality
console.log('Testing PWA functionality...');

// Check if service worker is supported
if ('serviceWorker' in navigator) {
  console.log('Service Worker is supported');
  
  // Register service worker
  navigator.serviceWorker.register('/sw.js')
    .then(registration => {
      console.log('Service Worker registered with scope:', registration.scope);
      
      // Check for updates
      registration.update();
      
      // Listen for updates
      registration.addEventListener('updatefound', () => {
        console.log('New service worker update found');
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            console.log('New service worker state:', newWorker.state);
          });
        }
      });
    })
    .catch(error => {
      console.log('Service Worker registration failed:', error);
    });
} else {
  console.log('Service Worker is not supported');
}

// Check if the app is installed
if (window.matchMedia('(display-mode: standalone)').matches) {
  console.log('App is installed (standalone mode)');
} else if (window.navigator.standalone) {
  console.log('App is installed (iOS standalone mode)');
} else {
  console.log('App is not installed');
}

// Listen for beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('Install prompt is available');
  // Prevent the mini-infobar from appearing on mobile
  // e.preventDefault();
  // Store the event for later use
  // window.deferredPrompt = e;
});

// Check for manifest
fetch('/manifest.json')
  .then(response => {
    if (response.ok) {
      console.log('Web App Manifest found');
      return response.json();
    } else {
      console.log('Web App Manifest not found');
      throw new Error('Manifest not found');
    }
  })
  .then(manifest => {
    console.log('Manifest details:', manifest);
  })
  .catch(error => {
    console.log('Error fetching manifest:', error);
  });