import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import { useGames, usePlayers, useScoutingEvents } from '#/lib/scouting/hooks'
import { useCreateScoutingEvent } from '#/lib/scouting/mutation-hooks'
import type { EventType } from '#/lib/scouting/queries'
import { formatClock, isValidPlayerId } from '#/lib/directory/mappers'
import { EVENT_TYPES } from '#/server/scouting'
import { ScoutingNav, StatusMessage } from '#/components/ScoutingNav'

const GAME_ID = /^game-\d{3}$/
const dateFormat = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'America/Denver' })

export const Route = createFileRoute('/scouting/events')({
  validateSearch: (search: Record<string, unknown>) => ({
    playerId: isValidPlayerId(search.playerId) ? search.playerId : 'all',
    gameId: typeof search.gameId === 'string' && GAME_ID.test(search.gameId) ? search.gameId : 'all',
    eventType: EVENT_TYPES.includes(search.eventType as EventType) ? (search.eventType as EventType) : ('all' as const),
  }),
  head: () => ({ meta: [{ title: 'Scouting · Events' }] }),
  component: ScoutingEventsPage,
})

const selectClass = 'rounded-md border border-slate-300 bg-white px-2 py-1 text-sm'

function ScoutingEventsPage() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: '/scouting/events' })
  const players = usePlayers()
  const games = useGames({ status: 'final' })
  const events = useScoutingEvents({
    playerId: search.playerId === 'all' ? undefined : search.playerId,
    gameId: search.gameId === 'all' ? undefined : search.gameId,
    eventType: search.eventType === 'all' ? undefined : search.eventType,
  })

  return (
    <main className="mx-auto max-w-3xl p-6">
      <ScoutingNav />
      <h1 className="text-2xl font-bold text-slate-900">Scouting events</h1>

      <LogEventForm
        players={players.data ?? []}
        games={games.data ?? []}
        defaultPlayerId={search.playerId === 'all' ? '' : search.playerId}
        defaultGameId={search.gameId === 'all' ? '' : search.gameId}
      />

      <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-600">
        <label>
          Player{' '}
          <select
            className={selectClass}
            value={search.playerId}
            onChange={(e) => navigate({ search: { ...search, playerId: e.target.value } })}
          >
            <option value="all">All players</option>
            {players.data?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Game{' '}
          <select
            className={selectClass}
            value={search.gameId}
            onChange={(e) => navigate({ search: { ...search, gameId: e.target.value } })}
          >
            <option value="all">All games</option>
            {games.data?.map((g) => (
              <option key={g.id} value={g.id}>
                {dateFormat.format(new Date(g.played_at))} vs {g.opponent}
              </option>
            ))}
          </select>
        </label>
        <label>
          Type{' '}
          <select
            className={selectClass}
            value={search.eventType}
            onChange={(e) =>
              navigate({ search: { ...search, eventType: e.target.value === 'all' ? 'all' : (e.target.value as EventType) } })
            }
          >
            <option value="all">All types</option>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t} className="capitalize">
                {t}
              </option>
            ))}
          </select>
        </label>
      </div>

      {events.isPending ? (
        <StatusMessage>Loading events…</StatusMessage>
      ) : events.isError ? (
        <StatusMessage tone="error">Could not load events: {events.error.message}</StatusMessage>
      ) : events.data.length === 0 ? (
        <StatusMessage>No scouting events match these filters yet.</StatusMessage>
      ) : (
        <>
          <p className="mt-4 text-sm text-slate-600">{events.data.length} events</p>
          <ul className="mt-2 divide-y divide-slate-200 rounded-lg border border-slate-200">
            {events.data.map((e) => (
              <li key={e.id} className="grid grid-cols-[6rem_1fr] gap-x-3 px-4 py-2 text-sm sm:grid-cols-[7rem_5rem_1fr]">
                <span className="text-slate-600">{dateFormat.format(new Date(e.game.played_at))}</span>
                <span className="font-medium capitalize">{e.event_type}</span>
                <span className="col-span-2 text-slate-700 sm:col-span-1">
                  {e.player.full_name} vs {e.game.opponent}
                  {e.period ? ` · P${e.period}` : ''}
                  {e.clock_seconds !== null ? ` ${formatClock(e.clock_seconds)}` : ''}
                  {e.notes ? <span className="text-slate-500"> · {e.notes}</span> : null}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  )
}

type Option = { id: string }

function LogEventForm(props: {
  players: Array<Option & { full_name: string }>
  games: Array<Option & { opponent: string; played_at: string }>
  defaultPlayerId: string
  defaultGameId: string
}) {
  const create = useCreateScoutingEvent()
  const [playerId, setPlayerId] = useState(props.defaultPlayerId)
  const [gameId, setGameId] = useState(props.defaultGameId)
  const [eventType, setEventType] = useState<EventType>('shot')
  const [period, setPeriod] = useState(1)
  const [notes, setNotes] = useState('')

  function submit(e: FormEvent) {
    e.preventDefault()
    create.mutate(
      { player_id: playerId, game_id: gameId, event_type: eventType, period, clock_seconds: null, notes: notes || null },
      { onSuccess: () => setNotes('') },
    )
  }

  return (
    <form onSubmit={submit} className="mt-4 rounded-lg border border-slate-200 p-4">
      <h2 className="text-sm font-semibold text-slate-900">Log an event</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        <select aria-label="Player" required className={selectClass} value={playerId} onChange={(e) => setPlayerId(e.target.value)}>
          <option value="">Player…</option>
          {props.players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name}
            </option>
          ))}
        </select>
        <select aria-label="Game" required className={selectClass} value={gameId} onChange={(e) => setGameId(e.target.value)}>
          <option value="">Game…</option>
          {props.games.map((g) => (
            <option key={g.id} value={g.id}>
              {dateFormat.format(new Date(g.played_at))} vs {g.opponent}
            </option>
          ))}
        </select>
        <select aria-label="Event type" className={selectClass} value={eventType} onChange={(e) => setEventType(e.target.value as EventType)}>
          {EVENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select aria-label="Period" className={selectClass} value={period} onChange={(e) => setPeriod(Number(e.target.value))}>
          {[1, 2, 3, 4].map((n) => (
            <option key={n} value={n}>
              {n === 4 ? 'OT' : `P${n}`}
            </option>
          ))}
        </select>
        <input
          aria-label="Notes"
          className={`${selectClass} min-w-48 grow`}
          placeholder="Notes (optional)"
          value={notes}
          maxLength={500}
          onChange={(e) => setNotes(e.target.value)}
        />
        <button
          type="submit"
          disabled={create.isPending}
          className="rounded-md bg-sky-700 px-3 py-1 text-sm font-medium text-white hover:bg-sky-800 disabled:opacity-60"
        >
          {create.isPending ? 'Saving…' : 'Log event'}
        </button>
      </div>
      {create.isError && <StatusMessage tone="error">{create.error.message}</StatusMessage>}
      {create.isSuccess && (
        <p role="status" className="mt-2 text-sm text-emerald-700">
          Logged a {create.data.event_type}. Lists and totals are refreshing.
        </p>
      )}
    </form>
  )
}
