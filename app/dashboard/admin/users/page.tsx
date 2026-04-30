import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { isAdminUser } from '@/lib/auth'
import UserManagement from '../_components/UserManagement'

export default async function UsersPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')
  if (!isAdminUser(userId)) redirect('/dashboard/availability')

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.25rem' }}>User Management</h2>
      <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.75rem' }}>
        All accounts registered on the platform — view profiles, teams, and roles.
      </p>
      <UserManagement />
    </div>
  )
}
