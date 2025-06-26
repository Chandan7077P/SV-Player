'use client';

import { useState, useRef, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [connectionError, setConnectionError] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const connectSocket = () => {
      try {
        if (socketRef.current?.connected) {
          return;
        }

        const baseUrl = window.location.origin;
        console.log('Connecting to Socket.IO at:', baseUrl);

        socketRef.current = io(baseUrl, {
          path: '/api/socket',
          transports: ['websocket', 'polling'],
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 10000,
        });

        socketRef.current.on('connect', () => {
          console.log('Connected to Socket.IO');
          setIsConnected(true);
          setConnectionError('');
        });

        socketRef.current.on('connect_error', (error) => {
          console.error('Connection error:', error);
          setIsConnected(false);
          setConnectionError(`Connection error: ${error.message}`);
        });

        socketRef.current.on('disconnect', (reason) => {
          console.log('Disconnected:', reason);
          setIsConnected(false);
          setConnectionError(`Disconnected: ${reason}`);
        });

        socketRef.current.on('roomJoined', (data) => {
          console.log('Joined room:', data.roomId);
        });

        socketRef.current.on('videoSync', (data: { action: string; time?: number }) => {
          if (!videoRef.current) return;

          switch (data.action) {
            case 'play':
              videoRef.current.play().catch(console.error);
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
      } catch (error) {
        console.error('Socket setup error:', error);
        setConnectionError(`Setup error: ${error}`);
      }
    };

    connectSocket();

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
    if (!roomId) {
      setConnectionError('Please enter a room ID');
      return;
    }

    if (!socketRef.current?.connected) {
      setConnectionError('Not connected to server');
      return;
    }

    socketRef.current.emit('joinRoom', roomId);
  };

  const handleVideoAction = (action: string, time?: number) => {
    if (!socketRef.current?.connected || !roomId) {
      return;
    }

    socketRef.current.emit('videoSync', { action, time, room: roomId });
  };

  return (
    <main className="min-h-screen p-8 bg-gray-100">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center text-gray-800">SV Player</h1>
        
        <div className="space-y-4 bg-white p-6 rounded-lg shadow">
          <div className="flex gap-4">
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Enter room ID"
              className="flex-1 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleJoinRoom}
              disabled={!isConnected}
              className={`px-4 py-2 rounded font-medium ${
                isConnected
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
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
                <span className="text-green-500 font-medium">Connected</span>
              ) : (
                <div>
                  <span className="text-red-500 font-medium">Disconnected</span>
                  {connectionError && (
                    <p className="text-red-500 text-xs mt-1">{connectionError}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="aspect-video bg-black rounded-lg overflow-hidden shadow">
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