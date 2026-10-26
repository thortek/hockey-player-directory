import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { getCurrentStaff } from '#/server/get-current-staff'

// Layout for every /scouting page. A signed-out visitor is sent to /login.
// This is navigation convenience only: each server function still calls
// requireSession() and RLS still filters rows, so skipping this page check
// (or calling the server functions directly) returns no data.
export const Route = createFileRoute('/scouting')({
  beforeLoad: async ({ location }) => {
    try {
      return { staff: await getCurrentStaff() }
    } catch {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
  },
  component: Outlet,
})
