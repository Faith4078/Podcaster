import { TanStackDevtools } from '@tanstack/react-devtools';
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
  useRouterState,
} from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';

import MiniPlayer from '../components/MiniPlayer';
import PodcastrSidebar from '../components/PodcastrSidebar';
import ClerkProvider from '../integrations/clerk/provider';
import ConvexProvider from '../integrations/convex/provider';
import QueryProvider from '../integrations/query/provider';

import appCss from '../styles.css?url';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Podcaster — AI Podcast App' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
    ],
  }),
  shellComponent: RootDocument,
  component: AppShell,
});

const NO_SIDEBAR_ROUTES = ['/sign-in', '/sign-up'];

function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const withSidebar = !NO_SIDEBAR_ROUTES.some((p) => pathname.startsWith(p));

  if (!withSidebar) return <Outlet />;

  return (
    <div className="flex h-screen overflow-hidden bg-[#101114]">
      <PodcastrSidebar />
      <main className="flex-1 overflow-y-auto pb-16">
        <Outlet />
      </main>
      <MiniPlayer />
    </div>
  );
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
              <TanStackDevtools
                config={{ position: 'bottom-right' }}
                plugins={[
                  {
                    name: 'Tanstack Router',
                    render: <TanStackRouterDevtoolsPanel />,
                  },
                ]}
              />
            </ConvexProvider>
          </ClerkProvider>
        </QueryProvider>
        <Scripts />
      </body>
    </html>
  );
}
