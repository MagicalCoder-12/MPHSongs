# PWA Installation Guide

## Installing the App on Mobile Devices

This application supports Progressive Web App (PWA) installation on both Android and iOS devices, allowing you to use it like a native app with offline capabilities.

## Current PWA Setup

The application is configured with:
- Proper web app manifest at `/manifest.json`
- Service worker for offline functionality
- Multiple icon sizes for different devices
- Correct viewport settings for mobile optimization

## Installing the App on Mobile Devices

### Android Installation

1. Open the app in Chrome, Firefox, or Samsung Internet browser
2. Look for the install prompt that appears automatically, or:
   - Tap the three dots menu (⋮) in the browser toolbar
   - Select "Install app" or "Add to Home screen"
3. Confirm the installation when prompted
4. The app will be added to your home screen

### iOS Installation (iPhone/iPad)

1. Open the app in Safari
2. Tap the Share button (the square with an arrow pointing up)
3. Scroll down and select "Add to Home Screen"
4. Tap "Add" in the top right corner
5. The app icon will be added to your home screen

### Desktop Installation

#### Chrome
1. Open the app in Chrome
2. Click the install icon (⊞) in the address bar
3. Click "Install" to confirm

#### Edge
1. Open the app in Edge
2. Click the install icon (⊞) in the address bar
3. Click "Install" to confirm

#### Firefox
1. Open the app in Firefox
2. Click the three dots menu (⋯) next to the address bar
3. Select "Install" to confirm

#### Safari (macOS)
1. Open the app in Safari
2. Click "Safari" in the menu bar
3. Select "Preferences" → "Websites" → "PWA"
4. Enable PWA installation

## Benefits of Installing as PWA

- **Offline Access**: View your songs even without an internet connection
- **App-like Experience**: Use the app like a native mobile application
- **Push Notifications**: Get updates about new features (if implemented)
- **Home Screen Access**: Launch the app directly from your device
- **Fast Loading**: Cached resources ensure quick startup times
- **Reduced Data Usage**: Cached assets reduce data consumption

## Verifying Installation Success

After installation, you can verify the PWA is working correctly:

1. **Check the address bar**: Installed PWAs don't show the browser address bar
2. **Test offline functionality**: Turn off Wi-Fi and mobile data, then try accessing the app
3. **Verify icons**: The app should use the custom icons you created
4. **Check performance**: PWA should load faster than the web version

## Troubleshooting

### Installation Issues

1. **App won't install**:
   - Make sure you're using a supported browser (Chrome, Firefox, Safari, Edge)
   - Check that your browser is up to date
   - Ensure you have enough storage space on your device
   - Verify the web app manifest is properly configured

2. **App doesn't work offline**:
   - Make sure you've visited several pages while online to cache content
   - Check your browser settings to ensure offline functionality is enabled
   - Verify the service worker is registered correctly

3. **Icon doesn't appear correctly**:
   - Try uninstalling and reinstalling the app
   - Restart your device after installation
   - Check that all required icon sizes are present in the manifest

### iOS Specific Issues

1. **Share button missing**:
   - Make sure you're using Safari, not another browser
   - Check that you haven't previously dismissed the installation prompt

2. **App doesn't appear in full screen**:
   - During installation, make sure "Add to Home Screen" is selected
   - Check that "Open in Safari" isn't selected

### Android Specific Issues

1. **Installation prompt not appearing**:
   - Visit the site multiple times to trigger the prompt
   - Engage with the content (scroll, click buttons)
   - Some browsers require a minimum engagement time

2. **App appears in browser**:
   - Make sure you selected "Install" and not "Open"
   - Check that your device supports PWAs

## Uninstalling the PWA

### Android
1. Long-press on the app icon on your home screen
2. Select "Uninstall" or drag to the remove icon

### iOS
1. Long-press on the app icon on your home screen
2. Tap the "X" that appears
3. Confirm removal when prompted

### Desktop
1. Find the app in your applications list or start menu
2. Right-click and select "Uninstall" or "Remove"

## Developer Notes

For developers working on this project:

1. **Icon Generation**: See [CREATE_PWA_ICONS.md](CREATE_PWA_ICONS.md) for detailed instructions
2. **Manifest Configuration**: The manifest is located at `/public/manifest.json`
3. **Service Worker**: Located at `/public/sw.js` with workbox integration
4. **Testing**: Use browser dev tools to simulate offline conditions
5. **Deployment**: Ensure all icon paths are correct in production