import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import ScheduleView from '../_components/ScheduleView'

export default async function AvailabilityPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const user = await currentUser()
  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    user?.emailAddresses?.[0]?.emailAddress ||
    'Team Member'

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.25rem' }}>
        My Availability
      </h2>
      <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        Click slots to mark when you&apos;re free, then save. Your team will see your availability in Team Calendar.
      </p>
      <ScheduleView userId={userId} displayName={displayName} />
    </div>
  )
}
