'use client'

import Link from 'next/link'
import { LoginForm } from '@/components/auth/LoginForm'
import { SocialLoginButton } from '@/components/auth/SocialLoginButton'
import { Separator } from '@/components/ui/separator'

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm space-y-6 px-4">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to your Invoize account
        </p>
      </div>

      <div className="space-y-3">
        <SocialLoginButton provider="google" />
        <SocialLoginButton provider="instagram" disabled />
      </div>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground uppercase">or</span>
        <Separator className="flex-1" />
      </div>

      <LoginForm />

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  )
}
