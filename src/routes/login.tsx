import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { signIn } from '#/lib/auth/sign-in'
import { signOut } from '#/lib/auth/sign-out'

const SAFE_REDIRECT = /^\/(?!\/)/

export const Route = createFileRoute('/login')({
  // Only same-site paths are honored, so ?redirect= can't send staff to another site.
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === 'string' && SAFE_REDIRECT.test(search.redirect) ? search.redirect : '/scouting/players',
  }),
  head: () => ({ meta: [{ title: 'Staff sign-in' }] }),
  component: LoginPage,
})

const fieldClass = 'mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm'

function LoginPage() {
  const { redirect } = Route.useSearch()
  const navigate = useNavigate()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setPending(true)
    setMessage(null)
    const result = await signIn(email, password)
    setPending(false)
    if (!result.ok) {
      setMessage(result.message)
      return
    }
    // Drop anything cached while signed out, then let loaders re-check the new session.
    queryClient.clear()
    await router.invalidate()
    await navigate({ href: redirect })
  }

  async function handleSignOut() {
    const result = await signOut()
    queryClient.clear()
    await router.invalidate()
    setMessage(result.ok ? 'Signed out.' : result.message)
  }

  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="text-2xl font-bold text-slate-900">Staff sign-in</h1>
      <p className="mt-1 text-sm text-slate-600">Coaching, scouting, and medical staff use their own account.</p>

      <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
        <label className="block text-sm font-medium text-slate-700">
          Email
          <input
            type="email"
            autoComplete="username"
            required
            className={fieldClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Password
          <input
            type="password"
            autoComplete="current-password"
            required
            className={fieldClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {message && (
          <p role="alert" className="rounded-md bg-slate-100 p-3 text-sm text-slate-800">
            {message}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-sky-700 px-3 py-2 text-sm font-medium text-white hover:bg-sky-800 disabled:opacity-60"
        >
          {pending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <button type="button" onClick={handleSignOut} className="mt-4 text-sm text-slate-600 underline hover:text-slate-900">
        Sign out of this browser
      </button>
    </main>
  )
}
