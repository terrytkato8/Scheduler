import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import MonthCalendar from '../_components/MonthCalendar'

export default async function CalendarPage() {
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
        My Calendar
      </h2>
      <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        Add and view your personal events and scheduled shifts.
      </p>
      <MonthCalendar userId={userId} displayName={displayName} />
    </div>
  )
}
