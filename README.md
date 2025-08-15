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

### 📸 Screenshot Feature
- **One-click Screenshots** - Capture song lyrics as images
- **Download Capability** - Save screenshots directly to device
- **Clean Formatting** - Professional-looking image output

### 📱 Responsive Design
- **Mobile-First** - Works perfectly on all device sizes
- **Modern UI** - Clean, intuitive interface with Tailwind CSS
- **Dark/Light Mode** - Theme support for comfortable viewing

## 🚀 Technology Stack

- **Frontend**: Next.js 15 with App Router, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui with Radix UI primitives
- **Database**: MongoDB Atlas with Mongoose ODM
- **Backend**: Next.js API Routes
- **Deployment**: Vercel-ready
- **Screenshot**: html2canvas for image generation

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
- **Dialog Error Display**: Error messages shown directly in the create/edit dialog
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
```

4. **Start the development server**
```bash
npm run dev
```

5. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000)

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

3. **Deploy**
   - Click "Deploy"
   - Vercel will automatically build and deploy your application

### 3. Post-Deployment

- **Test your application** at the provided Vercel URL
- **Set up custom domain** if needed in Vercel dashboard
- **Monitor performance** using Vercel Analytics

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
- `GET /api/songs` - Fetch all songs with optional search and sorting
- `POST /api/songs` - Create a new song
- `GET /api/songs/[id]` - Get a specific song
- `PUT /api/songs/[id]` - Update a song
- `DELETE /api/songs/[id]` - Delete a song

### Choir Practice
- `PUT /api/songs/[id]/choir` - Add/remove song from choir practice

### Bulk Operations
- `DELETE /api/songs/delete-all` - Delete all songs (with confirmation)

## 🎯 Usage Guide

### Adding a Song
1. Click the "Add Song" button
2. Fill in the song title, select language, and add lyrics
3. Optionally check "Add to choir practice"
4. Click "Create Song"

### Managing Songs
- **Edit**: Click the edit icon on any song card
- **Delete**: Click the trash icon with confirmation dialog
- **Choir Practice**: Toggle choir status with the choir button
- **Screenshot**: Capture lyrics as an image with the download button

### Searching
- Use the search bar to find songs by title or lyrics content
- Search works across all languages simultaneously
- Results update in real-time as you type

### Sorting
- Use the sort dropdown to switch between:
  - **Most Recent**: Newest songs first
  - **Alphabetical**: A-Z order by title

## 🌍 Multi-Language Support

The application supports songs in:
- **Telugu** (తెలుగు)
- **English** 
- **Hindi** (हिन्दी)
- **Other** languages

MongoDB handles Unicode text storage, ensuring proper display of all languages.

## 🔧 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB Atlas connection string | Yes |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🚀 Built With

- [Next.js 15](https://nextjs.org/) - React framework
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) - Cloud database
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - Component library
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Vercel](https://vercel.com/) - Deployment platform

---

Built with ❤️ for music ministries and choir teams. Perfect for managing multilingual song collections! 🎵