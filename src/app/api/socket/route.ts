import { Server as SocketIOServer } from 'socket.io';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

declare global {
  var io: SocketIOServer | undefined;
}

// Keep track of active connections
let io: SocketIOServer;

if (!global.io) {
  io = new SocketIOServer({
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });
  global.io = io;
} else {
  io = global.io;
}

io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('joinRoom', (roomId: string) => {
    socket.join(roomId);
    console.log(`Client joined room: ${roomId}`);
  });

  socket.on('videoSync', (data: { action: string; time?: number; room: string }) => {
    console.log('Video sync event:', data);
    socket.to(data.room).emit('videoSync', {
      action: data.action,
      time: data.time,
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

export async function GET(request: NextRequest) {
  try {
    // @ts-ignore
    await io.attachRequest(request);
    return new NextResponse(null, { 
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST',
      }
    });
  } catch (error) {
    console.error('Socket.IO error:', error);
    return new NextResponse(null, { status: 500 });
  }
}

export const dynamic = 'force-dynamic'; 