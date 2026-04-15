import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import AppNav from '@/app/_components/AppNav'

export default async function ProjectsLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f0f2f5' }}>
      <AppNav />
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
        {children}
      </div>
    </div>
  )
}
