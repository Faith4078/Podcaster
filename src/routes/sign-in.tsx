import { SignUp } from '@clerk/tanstack-react-start'
import { createFileRoute } from '@tanstack/react-router'
import AuthPageLayout from '../components/AuthPageLayout'

export const Route = createFileRoute('/sign-in')({
  component: SignUpPage,
})

const clerkAppearance = {
  variables: {
    // Brand accent — orange
    colorPrimary: '#f97535',
    colorPrimaryForeground: '#ffffff',

    // Card background — solid, never transparent
    colorBackground: '#13162b',

    // Text colors — high contrast against #13162b
    colorForeground: '#ffffff',
    colorMutedForeground: '#b0b8d1',

    // Input fields
    colorInput: '#1c1f38',
    colorInputForeground: '#ffffff',

    // Misc
    colorNeutral: '#8892b0',
    colorDanger: '#f87171',
    colorSuccess: '#4ade80',
    colorWarning: '#fbbf24',

    // Shape
    borderRadius: '10px',
    fontFamily: 'inherit',
    fontSize: '14px',
  },
} as const

function SignUpPage() {
  return (
    <AuthPageLayout>
      <SignUp appearance={clerkAppearance} />
    </AuthPageLayout>
  )
}
