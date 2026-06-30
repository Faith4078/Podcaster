import { TanStackDevtools } from '@tanstack/react-devtools'
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
  useRouterState,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { Menu } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Toaster } from 'sonner'

import MiniPlayer from '../components/MiniPlayer'
import PodcastrSidebar from '../components/PodcastrSidebar'
import ClerkProvider from '../integrations/clerk/provider'
import ConvexProvider from '../integrations/convex/provider'
import QueryProvider from '../integrations/query/provider'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Podcastr — AI Podcast App' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  shellComponent: RootDocument,
  component: AppShell,
})

const NO_SIDEBAR_ROUTES = ['/sign-in', '/sign-up']

function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const withSidebar = !NO_SIDEBAR_ROUTES.some((p) => pathname.startsWith(p))
  const [navOpen, setNavOpen] = useState(false)

  // Close the mobile drawer on navigation.
  useEffect(() => {
    setNavOpen(false)
  }, [pathname])

  // Close the mobile drawer on Escape.
  useEffect(() => {
    if (!navOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNavOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navOpen])

  if (!withSidebar) return <Outlet />

  return (
    <div className="flex h-screen overflow-hidden bg-[#101114]">
      <PodcastrSidebar open={navOpen} onClose={() => setNavOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar with hamburger — desktop uses the static sidebar. */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-[#252525] bg-[#15171C] px-4 md:hidden">
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            aria-label="Open menu"
            title="Open menu"
            className="text-white transition-colors hover:text-[#f97535]"
          >
            <Menu size={24} />
          </button>
          <span className="text-lg font-bold tracking-tight text-white">Podcastr</span>
        </header>
        {/* Bottom padding leaves room for the floating MiniPlayer and respects
            the iOS safe-area inset. */}
        <main className="flex-1 overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+6rem)] md:pb-24">
          <Outlet />
        </main>
      </div>
      <MiniPlayer />
    </div>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="font-sans antialiased bg-[#101114] text-white [overflow-wrap:anywhere]">
        <QueryProvider>
          <ClerkProvider>
            <ConvexProvider>
              {children}
              <Toaster
                theme="dark"
                position="bottom-right"
                richColors
                toastOptions={{
                  style: {
                    background: '#15171C',
                    border: '1px solid #252525',
                    color: '#ffffff',
                  },
                }}
              />
              <TanStackDevtools
                config={{ position: 'bottom-right' }}
                plugins={[{ name: 'Tanstack Router', render: <TanStackRouterDevtoolsPanel /> }]}
              />
            </ConvexProvider>
          </ClerkProvider>
        </QueryProvider>
        <Scripts />
      </body>
    </html>
  )
}
