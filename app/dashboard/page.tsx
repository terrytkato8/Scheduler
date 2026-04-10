import { auth, currentUser } from '@clerk/nextjs/server'
import { UserButton } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import ScheduleView from './_components/ScheduleView'

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const user = await currentUser()
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.emailAddresses?.[0]?.emailAddress || 'Team Member'

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Nav */}
      <nav
        style={{
          background: 'white',
          borderBottom: '1px solid #e2e8f0',
          padding: '0.875rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <span style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1e293b', letterSpacing: '-0.01em' }}>
          Team Scheduler
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.875rem', color: '#64748b' }}>{displayName}</span>
          <UserButton afterSignOutUrl="/" />
        </div>
      </nav>

      {/* Main */}
      <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <ScheduleView userId={userId} />
      </main>
    </div>
  )
}
