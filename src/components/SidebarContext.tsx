import { PanelLeft } from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';

/** Tailwind `md` breakpoint — below this the sidebar is an off-canvas drawer. */
const MOBILE_BREAKPOINT = 768;

type SidebarContextValue = {
  /** Mobile drawer open state (ignored on md+, where the sidebar is in-flow). */
  openMobile: boolean;
  setOpenMobile: Dispatch<SetStateAction<boolean>>;
  /** Desktop icon-rail collapse state (ignored below md). */
  collapsed: boolean;
  setCollapsed: Dispatch<SetStateAction<boolean>>;
  /** Toggles the drawer on mobile, the icon-rail collapse on desktop. */
  toggleSidebar: () => void;
  isMobile: boolean;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used within a SidebarProvider');
  return ctx;
}

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isMobile, setIsMobile] = useState(false);
  const [openMobile, setOpenMobile] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => setIsMobile(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  const toggleSidebar = useCallback(() => {
    if (isMobile) setOpenMobile((open) => !open);
    else setCollapsed((c) => !c);
  }, [isMobile]);

  const value = useMemo(
    () => ({
      openMobile,
      setOpenMobile,
      collapsed,
      setCollapsed,
      toggleSidebar,
      isMobile,
    }),
    [openMobile, collapsed, toggleSidebar, isMobile],
  );

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

/** Header toggle button — slides the drawer on mobile, collapses to an icon rail on md+. */
export function SidebarTrigger() {
  const { toggleSidebar, collapsed, openMobile, isMobile } = useSidebar();
  return (
    <button
      type="button"
      onClick={toggleSidebar}
      aria-label="Toggle sidebar"
      title="Toggle sidebar"
      aria-expanded={isMobile ? openMobile : !collapsed}
      className="flex h-11 w-11 items-center justify-center rounded-lg text-[#71788B] transition-colors duration-300 ease-out hover:bg-white/6 hover:text-white"
    >
      <PanelLeft size={20} />
    </button>
  );
}
