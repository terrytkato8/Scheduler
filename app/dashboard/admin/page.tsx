import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { isAdminUser } from '@/lib/auth'
import AdminPanel from './_components/AdminPanel'

export default async function AdminPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')
  if (!isAdminUser(userId)) redirect('/dashboard/availability')

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.25rem' }}>Admin Panel</h2>
      <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.75rem' }}>
        Review and action Team Lead requests from your team.
      </p>
      <AdminPanel />
    </div>
  )
}
