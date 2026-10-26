import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { getHealthNotes, getScoutingNotes } from '#/server/scouting-notes'
import { signOut } from '#/lib/auth/sign-out'
import { ScoutingNav, StatusMessage } from '#/components/ScoutingNav'

// Staff overview. Both lists come from server functions that verify the
// session and query as this staff member; RLS decides which rows exist here.
// The page never filters by role itself.
export const Route = createFileRoute('/scouting/')({
  loader: async () => {
    const [scouting, health] = await Promise.all([getScoutingNotes(), getHealthNotes()])
    return { scouting, health }
  },
  head: () => ({ meta: [{ title: 'Scouting · Staff overview' }] }),
  component: ScoutingOverviewPage,
})

const dateFormat = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'America/Denver' })

function ScoutingOverviewPage() {
  const { staff } = Route.useRouteContext()
  const { scouting, health } = Route.useLoaderData()
  const router = useRouter()
  const queryClient = useQueryClient()

  async function handleSignOut() {
    await signOut()
    queryClient.clear()
    await router.invalidate()
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <ScoutingNav />
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-bold text-slate-900">Staff overview</h1>
        <p className="text-sm text-slate-600">
          Signed in as <span className="font-medium">{staff.displayName}</span> ·{' '}
          <span className="capitalize">{staff.role}</span>{' '}
          <button type="button" onClick={handleSignOut} className="ml-2 underline hover:text-slate-900">
            Sign out
          </button>
        </p>
      </div>

      <section aria-labelledby="scouting-notes" className="mt-6">
        <h2 id="scouting-notes" className="text-lg font-semibold text-slate-900">
          Scouting notes ({scouting.notes.length})
        </h2>
        {scouting.notes.length === 0 ? (
          <StatusMessage>No scouting notes are available to your account.</StatusMessage>
        ) : (
          <ul className="mt-2 max-h-96 divide-y divide-slate-200 overflow-y-auto rounded-lg border border-slate-200">
            {scouting.notes.map((n) => (
              <li key={n.id} className="px-4 py-2 text-sm">
                <span className="font-medium">{n.playerName}</span>{' '}
                <span className="capitalize text-slate-600">
                  {n.type} vs {n.opponent}, {dateFormat.format(new Date(n.playedAt))}
                </span>
                <p className="text-slate-700">{n.notes}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="health-notes" className="mt-8">
        <h2 id="health-notes" className="text-lg font-semibold text-slate-900">
          Medical and sports-science notes ({health.length})
        </h2>
        {health.length === 0 ? (
          <StatusMessage>No medical notes are available to your account.</StatusMessage>
        ) : (
          <ul className="mt-2 divide-y divide-slate-200 rounded-lg border border-slate-200">
            {health.map((h) => (
              <li key={h.id} className="px-4 py-2 text-sm">
                <span className="font-medium">
                  {h.playerName} #{h.jerseyNumber}
                </span>{' '}
                <span className="text-slate-600">
                  {h.category.replace(/_/g, ' ')} · {h.availability} · {dateFormat.format(new Date(`${h.recordedOn}T12:00:00Z`))}
                </span>
                {h.notes && <p className="text-slate-700">{h.notes}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
