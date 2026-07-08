import { createFileRoute } from '@tanstack/react-router';
import { AuthenticateWithRedirectCallback } from '@clerk/tanstack-react-start';

export const Route = createFileRoute('/sign-up/sso-callback')({
  component: SSOCallback,
});

function SSOCallback() {
  return (
    <AuthenticateWithRedirectCallback
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
    />
  );
}
