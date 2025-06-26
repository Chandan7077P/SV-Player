import { Server } from 'socket.io';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

declare global {
  var io: Server | undefined;
}

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  if (!global.io) {
    global.io = new Server({
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
      transports: ['websocket', 'polling'],
      connectTimeout: 10000,
    });

    global.io.on('connection', (socket) => {
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

      socket.on('disconnect', () => {
        console.log(`Client ${socket.id} disconnected`);
      });
    });
  }

  try {
    // @ts-ignore
    await global.io.attachWebSocket(req);
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error('Socket error:', error);
    return new NextResponse('Socket error', { status: 500 });
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

export const config = {
  api: {
    bodyParser: false,
  },
}; 