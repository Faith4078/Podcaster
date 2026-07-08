import { ClerkProvider } from '@clerk/tanstack-react-start'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
if (!PUBLISHABLE_KEY) {
  throw new Error('Add your Clerk Publishable Key to the .env.local file')
}

export default function AppClerkProvider({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      afterSignOutUrl="/"
      appearance={{
        variables: {
          colorBackground: '#15171C',
          colorPrimary: '#f97535',
          colorForeground: '#ffffff',
          colorMutedForeground: '#71788B',
          colorInput: '#1c1e26',
          colorInputForeground: '#ffffff',
          colorNeutral: '#71788B',
          colorBorder: '#252525',
          colorDanger: '#f87171',
          colorSuccess: '#4ade80',
          colorWarning: '#fbbf24',
          borderRadius: '0.75rem',
        },
      }}
    >
      {children}
    </ClerkProvider>
  )
}
