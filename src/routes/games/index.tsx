import { Link, createFileRoute } from '@tanstack/react-router'
import { getGames } from '#/server/directory'
import { parseStatusFilter, type StatusFilter } from '#/lib/directory/mappers'

const STATUSES: StatusFilter[] = ['all', 'upcoming', 'final']

export const Route = createFileRoute('/games/')({
  validateSearch: (search: Record<string, unknown>) => ({
    status: parseStatusFilter(search.status),
  }),
  loaderDeps: ({ search }) => ({ status: search.status }),
  loader: ({ deps }) => getGames({ data: deps }),
  head: () => ({
    meta: [
      { title: 'Games board' },
      { name: 'description', content: 'Upcoming and final games for hockey ops staff.' },
    ],
  }),
  component: GamesIndexPage,
})

const dateFormat = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'America/Denver' })

function GamesIndexPage() {
  const { games } = Route.useLoaderData()

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold text-slate-900">Games board</h1>
      <p className="mt-2 text-slate-600">
        {games.length} games match this filter. Staff can see who was scouted in each game under Scouting.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {STATUSES.map((status) => (
          <Link
            key={status}
            to="/games"
            search={{ status }}
            className="rounded-full border border-slate-300 px-3 py-1 text-sm capitalize text-slate-700 hover:bg-slate-100"
            activeOptions={{ includeSearch: true }}
            activeProps={{ className: 'border-sky-600 bg-sky-50 text-sky-800' }}
          >
            {status}
          </Link>
        ))}
      </div>

      <ul className="mt-6 divide-y divide-slate-200 rounded-lg border border-slate-200">
        {games.map((game) => (
          <li key={game.id} className="grid grid-cols-[1fr_auto] gap-1 px-4 py-3 text-sm sm:grid-cols-[8rem_1fr_auto]">
            <span className="text-slate-600">{dateFormat.format(new Date(game.date))}</span>
            <span>
              {game.isHome ? 'vs' : '@'} <span className="font-medium">{game.opponent}</span>
            </span>
            <span className="capitalize text-slate-600">{game.status}</span>
          </li>
        ))}
      </ul>
    </main>
  )
}
