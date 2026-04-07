import './globals.css'
import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'SwipyEat Manager',
  description: 'Restaurant SaaS Dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider
      domain={process.env.NEXT_PUBLIC_CLERK_DOMAIN}
      isSatellite={process.env.NEXT_PUBLIC_CLERK_IS_SATELLITE === 'true'}
      signInUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || `${process.env.NEXT_PUBLIC_LANDING_URL}/sign-in`}
    >
      <html lang="en">
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <body suppressHydrationWarning>
          {children}
          <Toaster position="top-right" expand={true} richColors />
        </body>
      </html>
    </ClerkProvider>
  )
}
