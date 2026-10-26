import { Link } from '@tanstack/react-router'

export function AppNav() {
  return (
    <nav
      aria-label="Main"
      className="flex flex-wrap gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium"
    >
      <Link
        to="/"
        className="text-slate-700 hover:text-slate-900"
        activeProps={{ className: 'text-sky-700 underline' }}
      >
        Home
      </Link>
      <Link
        to="/players"
        search={{ position: 'all' }}
        className="text-slate-700 hover:text-slate-900"
        activeProps={{ className: 'text-sky-700 underline' }}
      >
        Players
      </Link>
      <Link
        to="/games"
        search={{ status: 'all' }}
        className="text-slate-700 hover:text-slate-900"
        activeProps={{ className: 'text-sky-700 underline' }}
      >
        Games
      </Link>
      <Link
        to="/scouting"
        className="text-slate-700 hover:text-slate-900"
        activeProps={{ className: 'text-sky-700 underline' }}
      >
        Scouting
      </Link>
      <Link
        to="/login"
        search={{ redirect: '/scouting/players' }}
        className="ml-auto text-slate-700 hover:text-slate-900"
        activeProps={{ className: 'text-sky-700 underline' }}
      >
        Staff sign-in
      </Link>
    </nav>
  )
}
