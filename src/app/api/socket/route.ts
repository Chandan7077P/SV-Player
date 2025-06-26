import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

declare global {
  var io: SocketIOServer | undefined;
}

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
        transports: ['websocket', 'polling'],
        path: '/api/socket',
        addTrailingSlash: false,
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

    // Respond to the WebSocket upgrade request
    if (req.headers.get('upgrade') === 'websocket') {
      const res = new NextResponse(null, {
        status: 101,
        headers: {
          'Upgrade': 'websocket',
          'Connection': 'Upgrade',
        },
      });
      return res;
    }

    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Socket.IO setup error:', error);
    return new NextResponse(null, { status: 500 });
  }
}

export const dynamic = 'force-dynamic'; 