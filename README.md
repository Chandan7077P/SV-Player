# SV Player - Synchronized Video Player

A web application that allows two parties to watch local videos in sync. The video files are loaded from local storage, and the playback is synchronized between users through WebSocket connections.

## Features

- Load local video files
- Real-time synchronization of video playback
- Play, pause, and seek synchronization
- Room-based watching sessions
- Minimal data usage (videos are not streamed)

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

## Usage

1. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

2. Open your browser and navigate to `http://localhost:3000`

3. To watch videos in sync:
   - Both users should open the application in their browsers
   - Enter the same room ID
   - Click "Join Room"
   - Load your local video file
   - The video playback will be synchronized between both users

## How It Works

- The application uses Socket.IO for real-time communication
- Video files are loaded locally in each user's browser
- Only playback control signals are sent over the network
- When one user plays, pauses, or seeks the video, the action is synchronized with the other user

## Technical Stack

- Next.js
- React
- TypeScript
- Socket.IO
- Tailwind CSS 