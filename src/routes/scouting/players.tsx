import { Link, createFileRoute } from '@tanstack/react-router'
import { usePlayers } from '#/lib/scouting/hooks'
import { parsePositionFilter, type PositionFilter } from '#/lib/directory/mappers'
import { ScoutingNav, StatusMessage } from '#/components/ScoutingNav'

const POSITIONS: PositionFilter[] = ['all', 'forward', 'defense', 'goalie']

export const Route = createFileRoute('/scouting/players')({
  validateSearch: (search: Record<string, unknown>) => ({ position: parsePositionFilter(search.position) }),
  head: () => ({ meta: [{ title: 'Scouting · Players' }] }),
  component: ScoutingPlayersPage,
})

function ScoutingPlayersPage() {
  const { position } = Route.useSearch()
  const players = usePlayers(position === 'all' ? {} : { position })

  return (
    <main className="mx-auto max-w-3xl p-6">
      <ScoutingNav />
      <h1 className="text-2xl font-bold text-slate-900">Scouting roster</h1>

      <nav aria-label="Filter by position" className="mt-4 flex flex-wrap gap-2">
        {POSITIONS.map((p) => (
          <Link
            key={p}
            to="/scouting/players"
            search={{ position: p }}
            className="rounded-full border border-slate-300 px-3 py-1 text-sm capitalize text-slate-700 hover:bg-slate-100"
            activeOptions={{ includeSearch: true }}
            activeProps={{ className: 'border-sky-600 bg-sky-50 text-sky-800' }}
          >
            {p}
          </Link>
        ))}
      </nav>

      {players.isPending ? (
        <StatusMessage>Loading players…</StatusMessage>
      ) : players.isError ? (
        <StatusMessage tone="error">Could not load players: {players.error.message}</StatusMessage>
      ) : players.data.length === 0 ? (
        <StatusMessage>No active players match this filter.</StatusMessage>
      ) : (
        <ul className="mt-6 divide-y divide-slate-200 rounded-lg border border-slate-200">
          {players.data.map((p) => (
            <li key={p.id} className="flex items-center justify-between px-4 py-3">
              <Link
                to="/scouting/events"
                search={{ playerId: p.id, gameId: 'all', eventType: 'all' }}
                className="font-medium text-sky-700 hover:underline"
              >
                {p.full_name}
              </Link>
              <span className="text-sm text-slate-600">
                #{p.jersey_number} · <span className="capitalize">{p.position}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
