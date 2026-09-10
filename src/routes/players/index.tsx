import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/players/')({
  head: () => ({
    meta: [
      { title: 'Player directory' },
      {
        name: 'description',
        content:
          'Working roster for hockey ops staff, with bookmarkable player pages next.',
      },
    ],
  }),
  component: PlayersIndexPage,
})

function PlayersIndexPage() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold text-slate-900">Player directory</h1>
      <p className="mt-2 text-slate-600">
        Browse the working roster so a teammate can paste a player URL and land
        on the same bookmarkable detail page.
      </p>
      <p className="mt-4 rounded-md bg-slate-100 p-3 text-sm text-slate-700">
        Placeholder: 24 seed players (name, number, position) will list here.
        Each row will link to /players/player-000 in a later step.
      </p>
    </main>
  )
}
