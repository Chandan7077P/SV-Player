import { Server as SocketIOServer } from 'socket.io';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

declare global {
  var io: SocketIOServer | undefined;
}

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    if (!global.io) {
      console.log('Initializing new Socket.IO server');
      
      const io = new SocketIOServer({
        cors: {
          origin: '*',
          methods: ['GET', 'POST'],
          credentials: true,
        },
        connectionStateRecovery: {
          maxDisconnectionDuration: 2 * 60 * 1000,
          skipMiddlewares: true,
        },
        allowEIO3: true,
        connectTimeout: 45000,
        pingTimeout: 30000,
        pingInterval: 25000,
      });

      io.on('connection', socket => {
        console.log('Client connected:', socket.id);

        socket.on('joinRoom', (roomId: string) => {
          socket.join(roomId);
          console.log(`Client ${socket.id} joined room: ${roomId}`);
          socket.emit('roomJoined', { roomId });
        });

        socket.on('videoSync', (data: { action: string; time?: number; room: string }) => {
          console.log(`Video sync from ${socket.id}:`, data);
          socket.to(data.room).emit('videoSync', data);
        });

        socket.on('disconnect', (reason) => {
          console.log(`Client ${socket.id} disconnected:`, reason);
        });
      });

      global.io = io;
    }

    const upgrade = req.headers.get('upgrade');
    const socketId = req.headers.get('socket-id');

    if (upgrade?.toLowerCase() === 'websocket') {
      try {
        // @ts-ignore
        await global.io.attachWebSocket(req, {
          headers: {
            'Sec-WebSocket-Protocol': 'websocket',
          }
        });
        return new NextResponse(null, { status: 101 });
      } catch (e) {
        console.error('WebSocket attachment error:', e);
        return new NextResponse('WebSocket upgrade failed', { status: 400 });
      }
    }

    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, socket-id',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Socket.IO setup error:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
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

export const dynamic = 'force-dynamic'; 