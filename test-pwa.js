// Simple test script to verify PWA functionality
console.log('Testing PWA functionality...');

// Check if service worker is registered
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    if (registrations.length > 0) {
      console.log('Service Worker is registered:', registrations[0].scope);
    } else {
      console.log('No Service Worker registered');
    }
  });
} else {
  console.log('Service Worker not supported');
}

// Check if the app is installed
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('Install prompt available');
  e.preventDefault();
});

// Check if the app is running as PWA
if (window.matchMedia('(display-mode: standalone)').matches) {
  console.log('Running as PWA');
} else {
  console.log('Not running as PWA');
}