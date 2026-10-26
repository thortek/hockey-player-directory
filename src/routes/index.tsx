import { Link, createFileRoute } from '@tanstack/react-router'
import { getDirectorySummary } from '#/server/directory'

export const Route = createFileRoute('/')({
  loader: () => getDirectorySummary(),
  head: () => ({
    meta: [
      { title: 'Hockey Operations Directory' },
      {
        name: 'description',
        content:
          'Staff landing for looking up players and games on arena wifi.',
      },
    ],
  }),
  component: HomePage,
})

function HomePage() {
  const summary = Route.useLoaderData()
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold text-slate-900">
        Hockey Operations Directory
      </h1>
      <p className="mt-2 text-slate-600">
        Hockey ops staff can open this directory on arena wifi and look up the
        working roster or tonight’s board without waiting on a spinner.
      </p>
      <dl className="mt-6 grid grid-cols-3 gap-3 text-center">
        <Link to="/players" search={{ position: 'all' }} className="rounded-lg border border-slate-200 p-4 hover:bg-slate-50">
          <dt className="text-sm text-slate-600">Active players</dt>
          <dd className="text-2xl font-bold text-slate-900">{summary.playerCount}</dd>
        </Link>
        <Link to="/games" search={{ status: 'upcoming' }} className="rounded-lg border border-slate-200 p-4 hover:bg-slate-50">
          <dt className="text-sm text-slate-600">Upcoming games</dt>
          <dd className="text-2xl font-bold text-slate-900">{summary.upcomingCount}</dd>
        </Link>
        <Link to="/games" search={{ status: 'final' }} className="rounded-lg border border-slate-200 p-4 hover:bg-slate-50">
          <dt className="text-sm text-slate-600">Final games</dt>
          <dd className="text-2xl font-bold text-slate-900">{summary.finalCount}</dd>
        </Link>
      </dl>
    </main>
  )
}
