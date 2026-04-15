import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { isAdminUser } from '@/lib/auth'
import Sidebar from './_components/Sidebar'
import AppNav from '@/app/_components/AppNav'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const user = await currentUser()
  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    user?.emailAddresses?.[0]?.emailAddress ||
    'Team Member'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f8fafc' }}>
      <AppNav />
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <Sidebar displayName={displayName} isAdmin={isAdminUser(userId)} />
        <div style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
          <main style={{ padding: '2rem', maxWidth: '1200px' }}>{children}</main>
        </div>
      </div>
    </div>
  )
}
