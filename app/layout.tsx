import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Gas Tracking System',
  description: 'Offline Gas Data Entry and Reporting System',
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

