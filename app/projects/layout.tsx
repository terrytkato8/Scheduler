import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import AppNav from '@/app/_components/AppNav'

export default async function ProjectsLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f8fafc' }}>
      <AppNav />
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
        <main style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>{children}</main>
      </div>
    </div>
  )
}
