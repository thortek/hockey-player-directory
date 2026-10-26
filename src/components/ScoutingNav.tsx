import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'

const linkClass = 'rounded-md px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100'
const activeClass = 'bg-sky-50 text-sky-800'

/** Tabs shared by the three scouting pages. */
export function ScoutingNav() {
  return (
    <nav aria-label="Scouting" className="mb-4 flex gap-1 border-b border-slate-200 pb-2">
      <Link to="/scouting/players" search={{ position: 'all' }} className={linkClass} activeProps={{ className: activeClass }}>
        Roster
      </Link>
      <Link
        to="/scouting/events"
        search={{ playerId: 'all', gameId: 'all', eventType: 'all' }}
        className={linkClass}
        activeProps={{ className: activeClass }}
      >
        Events
      </Link>
      <Link to="/scouting/aggregates" search={{ gameId: 'all' }} className={linkClass} activeProps={{ className: activeClass }}>
        Totals
      </Link>
    </nav>
  )
}

/** Loading, error, and empty states share one look so no view renders blank. */
export function StatusMessage({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'error' }) {
  return (
    <p
      role={tone === 'error' ? 'alert' : 'status'}
      className={
        tone === 'error'
          ? 'mt-6 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800'
          : 'mt-6 rounded-md bg-slate-100 p-3 text-sm text-slate-700'
      }
    >
      {children}
    </p>
  )
}
