// server.ts - Next.js Standalone + Socket.IO
import { setupSocket } from '@/lib/socket';
import { createServer } from 'http';
import { Server } from 'socket.io';
import next from 'next';
import { parse } from 'url';

const dev = process.env.NODE_ENV !== 'production';
const currentPort = 3000;
const hostname = '0.0.0.0';
const DIST_DIR = dev ? '.next-dev' : '.next';

// Custom server with Socket.IO integration
async function createCustomServer() {
  try {
    console.log(`> Booting Next.js in ${dev ? 'development' : 'production'} mode using ${DIST_DIR}`);

    // Create Next.js app
    const nextApp = next({ 
      dev,
      dir: process.cwd(),
      // Keep dev output isolated so stale Windows locks on .next/trace do not crash the server.
      conf: { distDir: DIST_DIR }
    });

    console.log('> Preparing Next.js app...');
    await nextApp.prepare();
    console.log('> Next.js app prepared');
    const handle = nextApp.getRequestHandler();

    // Create HTTP server that will handle both Next.js and Socket.IO
    const server = createServer((req, res) => {
      // Skip socket.io requests from Next.js handler
      if (req.url?.startsWith('/api/socketio')) {
        return;
      }
      
      const parsedUrl = parse(req.url || '/', true);
      handle(req, res, parsedUrl);
    });

    // Setup Socket.IO
    const io = new Server(server, {
      path: '/api/socketio',
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    setupSocket(io);

    // Start the server
    server.listen(currentPort, hostname, () => {
      console.log(`> Ready on http://${hostname}:${currentPort}`);
      console.log(`> Socket.IO server running at ws://${hostname}:${currentPort}/api/socketio`);
    });

  } catch (err) {
    console.error('Server startup error:', err);
    process.exit(1);
  }
}

// Start the server
createCustomServer();
