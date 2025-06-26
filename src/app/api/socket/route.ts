import { Server } from 'socket.io';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

declare global {
  var io: Server | undefined;
}

// New Next.js 13+ configuration format
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const preferredRegion = 'auto';

export async function GET(req: NextRequest) {
  try {
    if (!global.io) {
      console.log('Initializing Socket.IO server...');
      global.io = new Server({
        path: '/api/socket',
        addTrailingSlash: false,
        cors: {
          origin: '*',
          methods: ['GET', 'POST'],
          credentials: true,
        },
        transports: ['websocket', 'polling'],
        pingTimeout: 60000,
        pingInterval: 25000,
        connectTimeout: 20000,
        allowEIO3: true,
        upgradeTimeout: 10000,
        maxHttpBufferSize: 1e8,
        allowUpgrades: true,
        perMessageDeflate: {
          threshold: 2048
        }
      });

      global.io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        socket.on('error', (error) => {
          console.error('Socket error for client', socket.id, ':', error);
        });

        socket.on('connect_error', (error) => {
          console.error('Connection error for client', socket.id, ':', error);
        });

        socket.on('joinRoom', (roomId: string) => {
          socket.join(roomId);
          console.log(`Client ${socket.id} joined room: ${roomId}`);
          socket.emit('roomJoined', { roomId, status: 'connected' });
        });

        socket.on('videoSync', (data: { action: string; time?: number; room: string }) => {
          console.log(`Video sync from ${socket.id}:`, data);
          socket.to(data.room).emit('videoSync', data);
        });

        socket.on('disconnect', (reason) => {
          console.log(`Client ${socket.id} disconnected. Reason: ${reason}`);
        });

        // Send initial connection status
        socket.emit('connectionStatus', { 
          status: 'connected',
          transport: socket.conn.transport.name
        });

        // Handle transport change
        socket.conn.on('upgrade', (transport) => {
          console.log(`Transport upgraded for ${socket.id} to ${transport.name}`);
          socket.emit('connectionStatus', { 
            status: 'upgraded',
            transport: transport.name
          });
        });
      });

      console.log('Socket.IO server initialized successfully');
    }

    try {
      // @ts-ignore
      await global.io.attachWebSocket(req);
      return new NextResponse(null, { 
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    } catch (error) {
      console.error('WebSocket attachment error:', error);
      return new NextResponse('WebSocket attachment failed', { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }
  } catch (error) {
    console.error('Socket.IO server initialization error:', error);
    return new NextResponse('Socket.IO server initialization failed', { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, socket-id',
      'Access-Control-Max-Age': '86400',
    },
  });
} 