import TeamCalendar from '../_components/TeamCalendar'

export default function TeamPage() {
  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.25rem' }}>
        Team Calendar
      </h2>
      <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        See when everyone on your team is available across the week.
      </p>
      <TeamCalendar />
    </div>
  )
}
