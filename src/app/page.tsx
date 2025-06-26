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
    const connectSocket = async () => {
      try {
        // Get the current URL dynamically
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        const baseUrl = `${window.location.protocol}//${host}`;
        
        console.log('Attempting to connect to:', baseUrl);

        // Initialize socket connection
        socketRef.current = io(baseUrl, {
          path: '/api/socket',
          transports: ['websocket'],
          timeout: 10000,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        });

        socketRef.current.on('connect', () => {
          console.log('Socket connected successfully');
          setIsConnected(true);
          setConnectionError('');
        });

        socketRef.current.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
          setIsConnected(false);
          setConnectionError(`Connection error: ${error.message}`);
        });

        socketRef.current.on('disconnect', (reason) => {
          console.log('Socket disconnected:', reason);
          setIsConnected(false);
          setConnectionError(`Disconnected: ${reason}`);
        });

        socketRef.current.on('error', (error) => {
          console.error('Socket error:', error);
          setConnectionError(`Socket error: ${error}`);
        });

        socketRef.current.on('videoSync', (data: { action: string; time?: number }) => {
          console.log('Received videoSync event:', data);
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
      } catch (error) {
        console.error('Error setting up socket:', error);
        setConnectionError(`Setup error: ${error}`);
      }
    };

    connectSocket();

    return () => {
      if (socketRef.current) {
        console.log('Cleaning up socket connection');
        socketRef.current.disconnect();
      }
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
      console.log('Joining room:', roomId);
      socketRef.current.emit('joinRoom', roomId);
    }
  };

  const handleVideoAction = (action: string, time?: number) => {
    if (socketRef.current && roomId) {
      console.log('Emitting video action:', { action, time, room: roomId });
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
                <div>
                  <span className="text-red-500">Disconnected</span>
                  {connectionError && (
                    <p className="text-red-500 text-xs mt-1">{connectionError}</p>
                  )}
                </div>
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