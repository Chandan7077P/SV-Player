'use client';

import { useState, useRef, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io({
      path: '/api/socket',
      addTrailingSlash: false,
    });

    socketRef.current.on('connect', () => {
      setIsConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
    });

    socketRef.current.on('videoSync', (data: { action: string; time?: number }) => {
      if (!videoRef.current) return;

      switch (data.action) {
        case 'play':
          videoRef.current.play();
          break;
        case 'pause':
          videoRef.current.pause();
          break;
        case 'seek':
          if (data.time !== undefined) {
            videoRef.current.currentTime = data.time;
          }
          break;
      }
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const videoUrl = URL.createObjectURL(file);
      if (videoRef.current) {
        videoRef.current.src = videoUrl;
      }
    }
  };

  const handleJoinRoom = () => {
    if (roomId && socketRef.current) {
      socketRef.current.emit('joinRoom', roomId);
    }
  };

  const handleVideoAction = (action: string, time?: number) => {
    if (socketRef.current) {
      socketRef.current.emit('videoSync', { action, time, room: roomId });
    }
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center">SV Player</h1>
        
        <div className="space-y-4">
          <div className="flex gap-4">
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Enter room ID"
              className="flex-1 px-4 py-2 border rounded"
            />
            <button
              onClick={handleJoinRoom}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Join Room
            </button>
          </div>

          <div className="flex items-center gap-4">
            <input
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="flex-1"
            />
            <div className="text-sm">
              {isConnected ? (
                <span className="text-green-500">Connected</span>
              ) : (
                <span className="text-red-500">Disconnected</span>
              )}
            </div>
          </div>
        </div>

        <div className="aspect-video bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-full"
            controls
            onPlay={() => handleVideoAction('play')}
            onPause={() => handleVideoAction('pause')}
            onSeeked={() => handleVideoAction('seek', videoRef.current?.currentTime)}
          />
        </div>
      </div>
    </main>
  );
} 