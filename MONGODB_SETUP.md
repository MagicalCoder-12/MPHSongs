# MongoDB Setup Guide

## Quick Start Options

### Option 1: MongoDB Atlas (Recommended for Production)

1. **Create a free MongoDB Atlas account:**
   - Go to [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up for a free account

2. **Create a new cluster:**
   - Click "Build a Cluster"
   - Choose the free tier (M0 Sandbox)
   - Select a cloud provider and region
   - Create cluster

3. **Get your connection string:**
   - Go to Database → Connect
   - Choose "Connect your application"
   - Select Node.js and the latest version
   - Copy the connection string

4. **Update your .env.local file:**
   ```
   MONGODB_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/song_lyrics?retryWrites=true&w=majority
   ```

### Option 2: Local MongoDB (For Development)

#### Using Docker (Recommended):

1. **Install Docker** if you haven't already

2. **Run MongoDB with Docker:**
   ```bash
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

3. **Your local MongoDB is now running at:**
   ```
   MONGODB_URI=mongodb://localhost:27017/song_lyrics
   ```

#### Using MongoDB Community Server:

1. **Download and install MongoDB Community Server** for your OS from [https://www.mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)

2. **Start MongoDB service:**
   - **Windows:** `net start MongoDB`
   - **macOS:** `brew services start mongodb-community`
   - **Linux:** `sudo systemctl start mongod`

3. **Your local MongoDB is now running at:**
   ```
   MONGODB_URI=mongodb://localhost:27017/song_lyrics
   ```

## Testing Your Connection

After setting up MongoDB, you can test your connection by:

1. **Restart your development server:**
   ```bash
   npm run dev
   ```

2. **Check the console output** for "MongoDB connected successfully"

3. **Try creating a song** in the application

## Troubleshooting

### Connection Errors:

If you see "Database connection failed" errors:

1. **Check your MONGODB_URI** in .env.local
2. **Make sure MongoDB is running**
3. **Check your firewall settings**
4. **For Atlas: make sure your IP is whitelisted**

### Local MongoDB Issues:

1. **Check if MongoDB is running:**
   ```bash
   # For Docker
   docker ps
   
   # For service installation
   mongod --version
   ```

2. **Restart MongoDB:**
   ```bash
   # Docker
   docker restart mongodb
   
   # Service
   sudo systemctl restart mongod
   ```

3. **Check MongoDB logs:**
   ```bash
   # Docker
   docker logs mongodb
   
   # Service
   sudo tail -f /var/log/mongodb/mongod.log
   ```

## Next Steps

Once MongoDB is connected successfully:

1. **Create your first song** using the "Add Song" button
2. **Test all features** (search, sorting, choir practice, screenshots)
3. **Deploy to Vercel** using the instructions in README.md