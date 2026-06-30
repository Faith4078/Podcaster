import type { ReactNode } from 'react'

export default function AuthPageLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0d0f11]">
      {/* Background image */}
      <img
        src="/assets/Auth (3).webp"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />

      {/* Dim overlay — keeps image visible but adds contrast for the card */}
      <div className="pointer-events-none absolute inset-0 bg-black/50" />

      {/* Edge vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 70% at 50% 50%, transparent 0%, rgba(0,0,0,0.55) 100%)',
        }}
      />

      <div className="relative z-10">{children}</div>
    </div>
  )
}
