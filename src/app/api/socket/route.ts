import { Server as SocketIOServer } from 'socket.io';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const io = new SocketIOServer({
  path: '/api/socket',
  addTrailingSlash: false,
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('joinRoom', (roomId: string) => {
    socket.join(roomId);
    console.log(`Client joined room: ${roomId}`);
  });

  socket.on('videoSync', (data: { action: string; time?: number; room: string }) => {
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
  // @ts-ignore
  io.attachRequest(request);
  return new NextResponse(null, { status: 200 });
}

export const dynamic = 'force-dynamic'; 