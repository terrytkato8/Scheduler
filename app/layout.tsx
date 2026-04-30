import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata } from 'next'
import FloatingTaskPanel from './_components/FloatingTaskPanel'
import './globals.css'

export const metadata: Metadata = {
  title: 'Team Scheduler',
  description: 'Coordinate your team\'s availability with ease',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          {children}
          <FloatingTaskPanel />
        </body>
      </html>
    </ClerkProvider>
  )
}
