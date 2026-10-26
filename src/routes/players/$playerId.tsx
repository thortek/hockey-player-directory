import { Link, createFileRoute } from '@tanstack/react-router'
import { getPlayer } from '#/server/directory'

export const Route = createFileRoute('/players/$playerId')({
  loader: ({ params }) => getPlayer({ data: { playerId: params.playerId } }),
  head: ({ loaderData }) => ({
    meta: [{ title: loaderData?.player?.displayName ?? 'Unknown player' }],
  }),
  component: PlayerDetailPage,
})

function PlayerDetailPage() {
  const { player } = Route.useLoaderData()
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

      <p className="mt-6 rounded-md bg-slate-100 p-3 text-sm text-slate-700">
        Scouting events and medical notes are staff-only.{' '}
        <Link
          to="/scouting/events"
          search={{ playerId: player.id, gameId: 'all', eventType: 'all' }}
          className="font-medium text-sky-700 hover:underline"
        >
          Open this player in Scouting
        </Link>{' '}
        (staff sign-in required).
      </p>
    </main>
  )
}
