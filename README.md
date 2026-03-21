# 🎵 Song Lyrics Manager

A full-stack song lyric viewing and management web application built with Next.js 15, MongoDB Atlas, and TypeScript. Perfect for managing songs in multiple languages including Telugu, English, Hindi, and more.

## ✨ Features

### 🎵 Song Management
- **Add, Edit, Delete** songs with lyrics
- **Multi-language Support** - Store songs in Telugu, English, Hindi, and other languages
- **Smart Sorting** - View songs by most recent or alphabetical order
- **Confirmation Dialogs** - Safe deletion with warnings before removing songs
- **Delete All** - Clear the entire database with confirmation
- **Scrollable Lyrics** - Long lyrics are scrollable while keeping UI accessible

### 👥 Choir Practice Tab
- **Dedicated Choir Section** - Separate tab for choir practice songs
- **Easy Management** - Add/remove songs from choir practice without deleting from main list
- **Shared Access** - Choir practice songs visible to all users

### 🔍 Search Functionality
- **Powerful Search** - Search songs by title or lyrics content
- **Multi-language Search** - Search works across all languages
- **Real-time Results** - Instant search as you type

### 📱 Responsive Design
- **Mobile-First** - Works perfectly on all device sizes
- **Modern UI** - Clean, intuitive interface with Tailwind CSS
- **Dark/Light Mode** - Theme support for comfortable viewing
- **Protected Mobile Export API** - Sync lyrics to your Android app with a required secret header

### 📲 Progressive Web App (PWA)
- **Install on Mobile** - Add to home screen for app-like experience
- **Offline Access** - View songs even without internet connection
- **Cross-Platform** - Works on Android, iOS, and desktop browsers
- **Fast Loading** - Cached resources ensure quick startup times
- **Proper Icons** - Multiple icon sizes for different devices
- **Enhanced Caching** - Access previously viewed content offline

## 🚀 Technology Stack

- **Frontend**: Next.js 15 with App Router, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui with Radix UI primitives
- **Database**: MongoDB Atlas with Mongoose ODM
- **Backend**: Next.js API Routes
- **Deployment**: Vercel-ready
- **PWA Support**: Web Manifest, Service Worker, Workbox

## 🛡️ Error Handling

The application includes comprehensive error handling to ensure a smooth user experience:

### **Database Connection Errors**
- Clear error messages when MongoDB is not connected
- User-friendly error display with troubleshooting guidance
- Application remains functional even when database is unavailable

### **Form Validation Errors**
- Real-time validation in the create/edit song dialog
- Specific error messages for missing required fields
- Error display directly in the dialog for immediate feedback

### **Network Errors**
- Graceful handling of network connectivity issues
- Informative error messages to guide users
- Automatic retry functionality where appropriate

### **Error Display Features**
- **Main Page Error Display**: Red error box with clear messaging and guidance
- **Dialog Error Display**: Error messages shown directly in the dialog
- **Console Logging**: Detailed error information for debugging
- **User Guidance**: Clear next steps for resolving common issues

## 🧪 Testing the Application

### **Error Handling Demo**

To test the error handling features:

1. **Database Connection Error:**
   - Start the application without MongoDB running
   - You should see a red error box on the main page
   - Try creating a song - you'll see an error in the dialog
   - The error message will guide you to check your MongoDB connection

2. **Form Validation:**
   - Open the "Add Song" dialog
   - Try submitting without filling in required fields
   - You'll see validation errors in the dialog

3. **Network Error Simulation:**
   - Disconnect your internet connection
   - Try creating a song
   - You'll see a network error message

### **Current Status**

The application is currently showing a MongoDB connection error because:
- MongoDB is not running locally
- The connection string in `.env.local` points to `mongodb://localhost:27017/song_lyrics`

**To fix this:**
1. Follow the setup instructions in `MONGODB_SETUP.md`
2. Or update `.env.local` with your MongoDB Atlas connection string
3. Restart the development server

## 📲 PWA Installation

This application supports Progressive Web App installation on mobile devices:

### Android
1. Open the app in Chrome
2. Tap the install icon in the address bar
3. Confirm installation

### iOS
1. Open the app in Safari
2. Tap the Share button
3. Select "Add to Home Screen"

For detailed installation instructions, see [PWA_INSTALLATION.md](PWA_INSTALLATION.md)

### PWA Features Verification
- Check that the app installs with the correct icons
- Verify offline functionality works
- Test that the app can be launched from the home screen
- Confirm the app works without the browser UI

### Recent PWA Improvements
- **Enhanced Caching**: See [PWA_CACHING.md](PWA_CACHING.md) for details on improved offline access
- **Install Banner Fixes**: See [PWA_FIXES.md](PWA_FIXES.md) for details on recent improvements

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ 
- MongoDB Atlas account
- Vercel account (for deployment)

### Local Development

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd song-lyrics-manager
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your MongoDB Atlas connection string:
```env
MONGODB_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/song_lyrics?retryWrites=true&w=majority
MOBILE_API_SECRET=replace-this-with-a-long-random-secret
```

4. **Start the development server**
```bash
npm run dev
```

5. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000)

## 📡 Android Lyrics Sync API

Use the protected mobile endpoint below when your Android app needs to download lyrics for local storage:

- **Endpoint:** `GET /api/mobile/lyrics`
- **Required header:** `x-mobile-secret: <your MOBILE_API_SECRET value>`

Example:
```bash
curl http://localhost:3000/api/mobile/lyrics \
  -H "x-mobile-secret: replace-this-with-a-long-random-secret"
```

If the header is missing or wrong, the API returns `401 Unauthorized`.

Keep in mind this is only a basic shared-secret check. If your public website still exposes lyrics through other browser-accessible endpoints, those routes can still be read by users.

## 🚀 Deployment to Vercel

### 1. Push to GitHub
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Deploy to Vercel

1. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with your GitHub account
   - Click "New Project"
   - Select your repository

2. **Configure Environment Variables**
   - In your Vercel project dashboard, go to Settings → Environment Variables
   - Add your MongoDB connection string:
     ```
     Key: MONGODB_URI
     Value: mongodb+srv://your_username:your_password@your_cluster.mongodb.net/song_lyrics?retryWrites=true&w=majority
     ```
   - Add your Android sync secret:
     ```
     Key: MOBILE_API_SECRET
     Value: replace-this-with-a-long-random-secret
     ```

3. **Deploy**
   - Click "Deploy"
   - Vercel will automatically build and deploy your application

### 3. Post-Deployment

- **Test your application** at the provided Vercel URL
- **Set up custom domain** if needed in Vercel dashboard
- **Monitor performance** using Vercel Analytics
- **Verify PWA functionality** works in production

## 📁 Project Structure

```
src/
├── app/
│   ├── api/                 # API routes
│   │   └── songs/           # Song CRUD operations
│   │       ├── [id]/        # Individual song operations
│   │       ├── choir/       # Choir practice operations
│   │       └── delete-all/  # Bulk delete operation
│   ├── page.tsx            # Main application page
│   ├── layout.tsx          # Root layout
│   └── globals.css         # Global styles
├── components/
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── models/             # MongoDB schemas
│   │   └── Song.ts         # Song model
│   ├── mongodb.ts          # MongoDB connection
│   └── utils.ts            # Utility functions
└── hooks/                  # Custom React hooks
```

## 🔧 API Endpoints

### Songs
```
