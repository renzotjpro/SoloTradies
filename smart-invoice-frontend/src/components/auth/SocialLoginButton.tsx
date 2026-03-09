'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 2.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#feda75"/>
          <stop offset="25%" stopColor="#fa7e1e"/>
          <stop offset="50%" stopColor="#d62976"/>
          <stop offset="75%" stopColor="#962fbf"/>
          <stop offset="100%" stopColor="#4f5bd5"/>
        </linearGradient>
      </defs>
      <rect width="18" height="18" rx="4" fill="url(#ig-grad)"/>
      <rect x="2" y="2" width="14" height="14" rx="3" fill="none" stroke="white" strokeWidth="1.2"/>
      <circle cx="9" cy="9" r="3.5" fill="none" stroke="white" strokeWidth="1.2"/>
      <circle cx="13.5" cy="4.5" r="1" fill="white"/>
    </svg>
  )
}

export function SocialLoginButton({
  provider,
  disabled = false,
}: {
  provider: 'google' | 'instagram'
  disabled?: boolean
}) {
  const handleLogin = async () => {
    if (provider !== 'google') return
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/callback` },
    })
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleLogin}
      disabled={disabled}
      className="w-full h-11 gap-3 text-sm font-medium"
    >
      {provider === 'google' ? <GoogleIcon /> : <InstagramIcon />}
      {provider === 'google' ? 'Continue with Google' : 'Instagram (Coming Soon)'}
    </Button>
  )
}
