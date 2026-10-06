import { useAuth } from '@clerk/tanstack-react-start'
import { createFileRoute, Navigate, Outlet } from '@tanstack/react-router'

// Gate for pages that need a signed-in user (create, analytics, profile).
//
// This decides on the CLIENT, from Clerk's own session state, instead of asking
// a server function. The old server-side `auth()` check could report "signed
// out" for a user who was signed in (for example when the server did not see
// the session cookie), which sent them to /sign-in, and Clerk's sign-in page
// then bounced them straight back to the dashboard. It is a UX gate only: all
// data access is enforced by Convex using the user's Clerk identity.
export const Route = createFileRoute('/_authenticated')({
  component: AuthGate,
})

function AuthGate() {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#f97535] border-t-transparent" />
      </div>
    )
  }

  if (!isSignedIn) return <Navigate to="/sign-in" />
  return <Outlet />
}
