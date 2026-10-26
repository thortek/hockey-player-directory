import { Link, createFileRoute } from '@tanstack/react-router'
import { getPlayers } from '#/server/directory'
import { parsePositionFilter, type PositionFilter } from '#/lib/directory/mappers'

const POSITIONS: PositionFilter[] = ['all', 'forward', 'defense', 'goalie']

export const Route = createFileRoute('/players/')({
  validateSearch: (search: Record<string, unknown>) => ({
    position: parsePositionFilter(search.position),
  }),
  loaderDeps: ({ search }) => ({ position: search.position }),
  loader: ({ deps }) => getPlayers({ data: deps }),
  head: () => ({
    meta: [
      { title: 'Player directory' },
      { name: 'description', content: 'Working roster for hockey ops staff.' },
    ],
  }),
  component: PlayersIndexPage,
})

function PlayersIndexPage() {
  const players = Route.useLoaderData()
  const { position } = Route.useSearch()

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold text-slate-900">Player directory</h1>
      <p className="mt-2 text-slate-600">
        Showing {players.length} {position === 'all' ? 'active players' : `${position}s`}.
        Every row links to a bookmarkable player page.
      </p>

      <nav aria-label="Filter by position" className="mt-4 flex flex-wrap gap-2">
        {POSITIONS.map((p) => (
          <Link
            key={p}
            to="/players"
            search={{ position: p }}
            className="rounded-full border border-slate-300 px-3 py-1 text-sm capitalize text-slate-700 hover:bg-slate-100"
            activeOptions={{ includeSearch: true }}
            activeProps={{ className: 'border-sky-600 bg-sky-50 text-sky-800' }}
          >
            {p}
          </Link>
        ))}
      </nav>

      <ul className="mt-6 divide-y divide-slate-200 rounded-lg border border-slate-200">
        {players.map((player) => (
          <li key={player.id} className="flex items-center justify-between px-4 py-3">
            <Link
              to="/players/$playerId"
              params={{ playerId: player.id }}
              className="font-medium text-sky-700 hover:underline"
            >
              {player.displayName}
            </Link>
            <span className="text-sm text-slate-600">
              #{player.number} · <span className="capitalize">{player.position}</span>
            </span>
          </li>
        ))}
      </ul>
    </main>
  )
}
