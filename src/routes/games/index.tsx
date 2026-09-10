import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/games/')({
  head: () => ({
    meta: [
      { title: 'Games board' },
      {
        name: 'description',
        content:
          'Upcoming and final games for hockey ops staff to scan and share.',
      },
    ],
  }),
  component: GamesIndexPage,
})

function GamesIndexPage() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold text-slate-900">Games board</h1>
      <p className="mt-2 text-slate-600">
        Scan upcoming and final matchups tied to a player so staff can share a
        filtered schedule URL from the address bar.
      </p>
      <p className="mt-4 rounded-md bg-slate-100 p-3 text-sm text-slate-700">
        Schedule data loads in a later step. Expected seed: 22 games with date,
        opponent, status, and playerId.
      </p>
    </main>
  )
}
