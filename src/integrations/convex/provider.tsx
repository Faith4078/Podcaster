import { useAuth } from '@clerk/tanstack-react-start'
import { ConvexReactClient } from 'convex/react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL as string
if (!CONVEX_URL) throw new Error('Add VITE_CONVEX_URL to .env.local (run: npx convex dev)')

export const convex = new ConvexReactClient(CONVEX_URL)

export default function ConvexProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  )
}
