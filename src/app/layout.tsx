import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SV Player - Synchronized Video Player',
  description: 'Watch videos in sync with your friends',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
} 