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
  const { player, games } = Route.useLoaderData()
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

      <h2 className="mt-6 text-lg font-semibold text-slate-900">Games</h2>
      {games.length === 0 ? (
        <p className="mt-2 text-slate-600">No games tagged to this player yet.</p>
      ) : (
        <ul className="mt-2 divide-y divide-slate-200 rounded-lg border border-slate-200">
          {games.map((game) => (
            <li key={game.id} className="flex justify-between px-4 py-2 text-sm">
              <span>{dateFormat.format(new Date(game.date))} vs {game.opponent}</span>
              <span className="capitalize text-slate-600">{game.status}</span>
            </li>
          ))}
        </ul>
      )}
      <Link
        to="/games"
        search={{ status: 'all', playerId: player.id }}
        className="mt-4 inline-block text-sm text-sky-700 hover:underline"
      >
        Open this player's games board
      </Link>
    </main>
  )
}
