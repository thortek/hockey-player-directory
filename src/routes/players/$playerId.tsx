import { Link, createFileRoute } from '@tanstack/react-router'
import { getPlayer } from '#/server/directory'

export const Route = createFileRoute('/players/$playerId')({
  loader: ({ params }) => getPlayer({ data: { playerId: params.playerId } }),
  head: ({ loaderData }) => ({
    meta: [{ title: loaderData?.player?.displayName ?? 'Unknown player' }],
  }),
  component: PlayerDetailPage,
})

const dateFormat = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'America/Denver' })

function PlayerDetailPage() {
  const { player, games, events } = Route.useLoaderData()
  const { playerId } = Route.useParams()

  if (!player) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-bold text-slate-900">Unknown player</h1>
        <p className="mt-2 text-slate-600">
          No active player has the id <code>{playerId}</code>.
        </p>
        <Link to="/players" search={{ position: 'all' }} className="mt-4 inline-block text-sky-700 hover:underline">
          Back to the roster
        </Link>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <Link to="/players" search={{ position: 'all' }} className="text-sm text-sky-700 hover:underline">
        ← Roster
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">{player.displayName}</h1>
      <p className="mt-1 text-slate-600">
        #{player.number} · <span className="capitalize">{player.position}</span>
      </p>

      <h2 className="mt-6 text-lg font-semibold text-slate-900">Games scouted ({games.length})</h2>
      {games.length === 0 ? (
        <p className="mt-2 text-slate-600">No scouting events recorded for this player yet.</p>
      ) : (
        <Link
          to="/games"
          search={{ status: 'all', playerId: player.id }}
          className="mt-1 inline-block text-sm text-sky-700 hover:underline"
        >
          Open these games on the board
        </Link>
      )}

      {events.length > 0 && (
        <>
          <h2 className="mt-6 text-lg font-semibold text-slate-900">Scouting events</h2>
          <ul className="mt-2 divide-y divide-slate-200 rounded-lg border border-slate-200">
            {events.map((e) => (
              <li key={e.id} className="grid grid-cols-[6rem_1fr] gap-x-3 px-4 py-2 text-sm sm:grid-cols-[7rem_5rem_1fr]">
                <span className="text-slate-600">{dateFormat.format(new Date(e.date))}</span>
                <span className="font-medium capitalize">{e.type}</span>
                <span className="col-span-2 text-slate-600 sm:col-span-1">
                  vs {e.opponent}
                  {e.period ? ` · P${e.period}` : ''}
                  {e.clock ? ` ${e.clock}` : ''}
                  {e.notes ? ` · ${e.notes}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  )
}
