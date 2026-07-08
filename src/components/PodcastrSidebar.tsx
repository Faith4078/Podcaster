import { Show, UserButton, useUser } from '@clerk/tanstack-react-start';
import { Link } from '@tanstack/react-router';
import { useMutation } from 'convex/react';
import {
  Bookmark,
  Compass,
  CreditCard,
  Home,
  Mic,
  User,
  X,
} from 'lucide-react';
import { useEffect } from 'react';
import { api } from '../../convex/_generated/api';
import { useSidebar } from './SidebarContext';

const navItems = [
  { to: '/' as const, icon: Home, label: 'Home', exact: true },
  { to: '/discover' as const, icon: Compass, label: 'Discover' },
  { to: '/bookmarks' as const, icon: Bookmark, label: 'Bookmarks' },
  { to: '/create-podcast' as const, icon: Mic, label: 'Create Podcast' },
  { to: '/my-profile' as const, icon: User, label: 'My Profile' },
  { to: '/billing' as const, icon: CreditCard, label: 'Billing' },
];

export default function PodcastrSidebar() {
  const { openMobile, setOpenMobile, collapsed } = useSidebar();
  const closeMobile = () => setOpenMobile(false);
  const { user } = useUser();
  const ensureCurrentUser = useMutation(api.users.ensureCurrentUser);

  // Local-dev fallback: upsert current Clerk user into Convex on first load
  useEffect(() => {
    if (!user) return;
    ensureCurrentUser({
      clerkId: user.id,
      name: user.fullName ?? user.username ?? 'User',
      email: user.primaryEmailAddress?.emailAddress ?? '',
      imageUrl: user.imageUrl ?? undefined,
    }).catch(console.error);
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Shared base for nav links; when collapsed (md+) the label span is hidden
  // and the icon centers itself in the rail.
  const linkBase = `relative flex items-center gap-4 rounded-xl px-4 py-3 text-base font-bold transition-colors ${
    collapsed ? 'md:justify-center md:px-0' : ''
  }`;

  return (
    <>
      {/* Mobile drawer backdrop — tap to dismiss. Hidden on md+. */}
      {openMobile ? (
        <div
          className="fixed inset-0 z-[55] bg-black/60 md:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      ) : null}

      {/* Off-canvas drawer on mobile (slides in via the header trigger); a
          static in-flow column on md+ that collapses to an icon rail. */}
      <aside
        className={`fixed inset-y-0 left-0 z-[60] flex h-full shrink-0 flex-col bg-[#15171C] transition-[transform,width] duration-300 ease-out md:static md:z-auto md:translate-x-0 ${
          openMobile ? 'translate-x-0' : '-translate-x-full'
        } ${collapsed ? 'w-[270px] md:w-[72px]' : 'w-[270px]'}`}
      >
        {/* Logo (+ mobile close button) */}
        <div
          className={`flex items-center gap-3 px-7 py-8 ${
            collapsed ? 'md:justify-center md:px-0' : ''
          }`}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path d="M4 3.5L21 12L4 20.5V3.5Z" fill="#f97535" />
          </svg>
          <span
            className={`text-xl font-bold tracking-tight text-white ${
              collapsed ? 'md:hidden' : ''
            }`}
          >
            Podcaster
          </span>
          <button
            type="button"
            onClick={closeMobile}
            aria-label="Close menu"
            title="Close menu"
            className="ml-auto text-[#71788B] transition-colors hover:text-white md:hidden"
          >
            <X size={22} />
          </button>
        </div>

        {/* Nav */}
        <nav
          className={`mt-1 flex flex-col gap-0.5 pl-4 pr-0 ${
            collapsed ? 'md:px-3' : ''
          }`}
        >
          {navItems.map(({ to, icon: Icon, label, exact }) => (
            <Link
              key={to}
              to={to}
              onClick={closeMobile}
              title={label}
              activeOptions={exact ? { exact: true } : undefined}
              className={`${linkBase} text-[#71788B] hover:bg-white/6 hover:text-white`}
              activeProps={{
                className: `${linkBase} text-white bg-white/6 after:content-[''] after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2 after:h-7 after:w-[3px] after:rounded-l-full after:bg-[#f97535]`,
              }}
            >
              <Icon size={18} className="shrink-0" />
              <span className={`truncate ${collapsed ? 'md:hidden' : ''}`}>
                {label}
              </span>
            </Link>
          ))}
        </nav>

        <div className="flex-1" />

        {/* Account — Clerk UserButton when signed in; a sign-up CTA when not. */}
        <div
          className={`border-t border-white/6 px-6 py-5 ${
            collapsed ? 'md:px-3' : ''
          }`}
        >
          <Show when="signed-in">
            <UserButton
              showName
              appearance={{
                elements: {
                  rootBox: collapsed ? 'md:mx-auto' : '',
                  userButtonOuterIdentifier: `text-white font-semibold ${
                    collapsed ? 'md:hidden' : ''
                  }`,
                  userButtonPopoverCard: 'bg-[#15171C] border border-[#252525]',
                  userButtonPopoverMain: 'bg-[#15171C]',
                  userButtonPopoverActions: 'bg-[#15171C]',
                  userButtonPopoverActionButton: 'text-white hover:bg-white/5',
                  userButtonPopoverActionButtonIcon: 'text-[#71788B]',
                  userButtonPopoverActionButtonIconBox: 'text-[#71788B]',
                  userButtonPopoverFooter: 'bg-[#15171C]',
                },
              }}
            />
          </Show>
          <Show when="signed-out">
            <Link
              to="/sign-up"
              onClick={closeMobile}
              title="Sign up"
              className={`flex w-full items-center justify-center rounded-md bg-[#f97535] px-4 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 ${
                collapsed ? 'md:px-2' : ''
              }`}
            >
              <span className={collapsed ? 'md:hidden' : ''}>Sign up</span>
              {collapsed ? (
                <User size={18} className="hidden md:block" aria-hidden="true" />
              ) : null}
            </Link>
            <p
              className={`mt-3 text-center text-xs text-[#71788B] ${
                collapsed ? 'md:hidden' : ''
              }`}
            >
              Already have an account?{' '}
              <Link
                to="/sign-in"
                onClick={closeMobile}
                className="font-semibold text-[#f97535] hover:underline"
              >
                Sign in
              </Link>
            </p>
          </Show>
        </div>
      </aside>
    </>
  );
}
