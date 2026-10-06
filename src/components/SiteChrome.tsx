import { useUser } from '@clerk/tanstack-react-start'
import { List, Play } from '@phosphor-icons/react'
import { Link } from '@tanstack/react-router'
import './landing.css'

// Shared public header/footer for the marketing pages (landing, blog). Styles
// live in landing.css; wrap pages in `.landing-page` to pick them up.

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link
      to="/"
      className={`landing-brand ${light ? 'landing-brand-light' : ''}`}
      aria-label="Podcaster home"
    >
      <span className="landing-brand-mark" aria-hidden="true">
        <Play size={17} weight="fill" />
      </span>
      <span>
        podcaster<span className="landing-brand-period">.</span>
      </span>
    </Link>
  )
}

// Sign in / Start creating for visitors; a single Dashboard button once signed
// in. While Clerk is still loading we render nothing rather than flash the
// wrong buttons at someone who is already signed in.
function AuthActions() {
  const { isLoaded, isSignedIn } = useUser()

  if (!isLoaded) return <div className="landing-auth-placeholder" aria-hidden="true" />

  if (isSignedIn) {
    return (
      <Link to="/dashboard" className="landing-button landing-button-primary">
        Dashboard
      </Link>
    )
  }

  return (
    <>
      <Link to="/sign-in" className="landing-sign-in">
        Sign in
      </Link>
      <Link to="/sign-up" className="landing-button landing-button-primary">
        Start creating
      </Link>
    </>
  )
}

function MobileAuthLinks() {
  const { isLoaded, isSignedIn } = useUser()
  if (!isLoaded) return null
  if (isSignedIn) return <Link to="/dashboard">Dashboard</Link>
  return (
    <>
      <Link to="/sign-in">Sign in</Link>
      <Link to="/sign-up">Start creating</Link>
    </>
  )
}

export function SiteHeader() {
  return (
    <header className="landing-header">
      <div className="landing-container landing-nav">
        <Brand />
        <nav className="landing-desktop-nav" aria-label="Main navigation">
          <a href="/#how-it-works">How it works</a>
          <a href="/#features">Why Podcaster</a>
          <Link to="/blog">Blog</Link>
          <Link to="/discover">Explore podcasts</Link>
        </nav>
        <div className="landing-nav-actions">
          <AuthActions />
        </div>
        <details className="landing-mobile-menu">
          <summary aria-label="Open menu">
            <List size={24} weight="bold" />
          </summary>
          <nav aria-label="Mobile navigation">
            <a href="/#how-it-works">How it works</a>
            <a href="/#features">Why Podcaster</a>
            <Link to="/blog">Blog</Link>
            <Link to="/discover">Explore podcasts</Link>
            <MobileAuthLinks />
          </nav>
        </details>
      </div>
    </header>
  )
}

export function SiteFooter() {
  const { isSignedIn } = useUser()
  return (
    <footer className="landing-footer">
      <div className="landing-container landing-footer-inner">
        <Brand light />
        <p>Make something worth hearing.</p>
        <nav aria-label="Footer navigation">
          <Link to="/discover">Explore</Link>
          <Link to="/blog">Blog</Link>
          {isSignedIn ? (
            <Link to="/dashboard">Dashboard</Link>
          ) : (
            <>
              <Link to="/sign-in">Sign in</Link>
              <Link to="/sign-up">Get started</Link>
            </>
          )}
        </nav>
        <small>© {new Date().getFullYear()} Podcaster</small>
      </div>
    </footer>
  )
}
