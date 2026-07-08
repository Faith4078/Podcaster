import { TanStackDevtools } from '@tanstack/react-devtools';
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
  useRouterState,
} from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import { useEffect } from 'react';

import MiniPlayer from '../components/MiniPlayer';
import PodcastrSidebar from '../components/PodcastrSidebar';
import {
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '../components/SidebarContext';
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
    <SidebarProvider>
      <ShellLayout pathname={pathname} />
    </SidebarProvider>
  );
}

function ShellLayout({ pathname }: { pathname: string }) {
  // Auto-close the mobile drawer on navigation so a tapped link doesn't
  // leave it covering the page.
  const { setOpenMobile } = useSidebar();
  useEffect(() => {
    setOpenMobile(false);
  }, [pathname, setOpenMobile]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#101114]">
      <PodcastrSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Slim header bar — holds the sidebar trigger (drawer toggle on
            mobile, icon-rail collapse on md+). */}
        <header className="flex h-14 shrink-0 items-center border-b border-white/6 px-3">
          <SidebarTrigger />
        </header>
        <main className="flex-1 overflow-y-auto pb-16">
          <Outlet />
        </main>
      </div>
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
