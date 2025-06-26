import { Server as SocketIOServer } from 'socket.io';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

declare global {
  var io: SocketIOServer | undefined;
}

if (!global.io) {
  console.log('Initializing Socket.IO server');
  global.io = new SocketIOServer({
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket'],
    pingTimeout: 60000,
    pingInterval: 25000,
    connectTimeout: 10000,
  });

  global.io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('joinRoom', (roomId: string) => {
      socket.join(roomId);
      console.log(`Client ${socket.id} joined room: ${roomId}`);
      // Notify the client that they've joined the room
      socket.emit('roomJoined', { roomId });
    });

    socket.on('videoSync', (data: { action: string; time?: number; room: string }) => {
      console.log(`Video sync event from ${socket.id}:`, data);
      socket.to(data.room).emit('videoSync', {
        action: data.action,
        time: data.time,
      });
    });

    socket.on('disconnect', (reason) => {
      console.log(`Client ${socket.id} disconnected:`, reason);
    });

    socket.on('error', (error) => {
      console.error(`Socket ${socket.id} error:`, error);
    });
  });
} else {
  console.log('Using existing Socket.IO server');
}

export async function GET(request: NextRequest) {
  try {
    console.log('Handling Socket.IO request');
    // @ts-ignore
    await global.io.attachRequest(request);
    return new NextResponse(null, { 
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Credentials': 'true',
      }
    });
  } catch (error) {
    console.error('Socket.IO request error:', error);
    return new NextResponse(null, { status: 500 });
  }
}

export const dynamic = 'force-dynamic'; 