import { createFileRoute } from '@tanstack/react-router'
import LandingPage from '../components/LandingPage'

// The public homepage, for everyone. Signed-in users get a Dashboard button in
// the header; their dashboard lives at /dashboard.
export const Route = createFileRoute('/')({ component: LandingPage })
