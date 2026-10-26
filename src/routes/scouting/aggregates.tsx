import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useGames, usePlayerEventTotals } from '#/lib/scouting/hooks'
import { ScoutingNav, StatusMessage } from '#/components/ScoutingNav'

const GAME_ID = /^game-\d{3}$/
const dateFormat = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'America/Denver' })
const COLUMNS = ['goals', 'assists', 'shots', 'hits', 'takeaways', 'saves', 'penalties'] as const

export const Route = createFileRoute('/scouting/aggregates')({
  validateSearch: (search: Record<string, unknown>) => ({
    gameId: typeof search.gameId === 'string' && GAME_ID.test(search.gameId) ? search.gameId : 'all',
  }),
  head: () => ({ meta: [{ title: 'Scouting · Totals' }] }),
  component: ScoutingTotalsPage,
})

function ScoutingTotalsPage() {
  const { gameId } = Route.useSearch()
  const navigate = useNavigate({ from: '/scouting/aggregates' })
  const games = useGames({ status: 'final' })
  const totals = usePlayerEventTotals(gameId === 'all' ? {} : { gameId })

  return (
    <main className="mx-auto max-w-4xl p-6">
      <ScoutingNav />
      <h1 className="text-2xl font-bold text-slate-900">Player totals</h1>
      <p className="mt-1 text-sm text-slate-600">
        Counted in Postgres by <code>player_event_totals</code>, one round trip for every player.
      </p>

      <label className="mt-4 block text-sm text-slate-600">
        Game{' '}
        <select
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
          value={gameId}
          onChange={(e) => navigate({ search: { gameId: e.target.value } })}
        >
          <option value="all">Whole season</option>
          {games.data?.map((g) => (
            <option key={g.id} value={g.id}>
              {dateFormat.format(new Date(g.played_at))} vs {g.opponent}
            </option>
          ))}
        </select>
      </label>

      {totals.isPending ? (
        <StatusMessage>Loading totals…</StatusMessage>
      ) : totals.isError ? (
        <StatusMessage tone="error">Could not load totals: {totals.error.message}</StatusMessage>
      ) : totals.data.length === 0 ? (
        <StatusMessage>No scouting events recorded for this selection.</StatusMessage>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-3 py-2 font-medium">Player</th>
                <th className="px-3 py-2 text-right font-medium">GP</th>
                {COLUMNS.map((c) => (
                  <th key={c} className="px-3 py-2 text-right font-medium capitalize">
                    {c}
                  </th>
                ))}
                <th className="px-3 py-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {totals.data.map((row) => (
                <tr key={row.player_id}>
                  <td className="px-3 py-2">
                    <Link
                      to="/scouting/events"
                      search={{ playerId: row.player_id, gameId, eventType: 'all' }}
                      className="text-sky-700 hover:underline"
                    >
                      {row.full_name}
                    </Link>{' '}
                    <span className="text-slate-500">#{row.jersey_number}</span>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{row.games_scouted}</td>
                  {COLUMNS.map((c) => (
                    <td key={c} className="px-3 py-2 text-right tabular-nums">
                      {row[c]}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-right font-medium tabular-nums">{row.total_events}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
