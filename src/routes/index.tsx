import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
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
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold text-slate-900">
        Hockey Operations Directory
      </h1>
      <p className="mt-2 text-slate-600">
        Hockey ops staff can open this directory on arena wifi and look up the
        working roster or tonight’s board without waiting on a spinner.
      </p>
      <p className="mt-4 rounded-md bg-slate-100 p-3 text-sm text-slate-700">
        Placeholder snapshot: 24 players on the working roster · 22 games on
        the board. Live counts will server-render in a later step.
      </p>
    </main>
  )
}
