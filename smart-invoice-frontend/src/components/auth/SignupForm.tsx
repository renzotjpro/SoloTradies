'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

const signupSchema = z.object({
  fullName: z.string().min(2, 'Enter your full name'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  businessName: z.string().min(1, 'Enter your business name'),
  abn: z
    .string()
    .regex(/^\d{11}$/, 'ABN must be exactly 11 digits')
    .or(z.literal('')),
})

type SignupValues = z.infer<typeof signupSchema>

export function SignupForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { abn: '' },
  })

  const onSubmit = async (data: SignupValues) => {
    setError(null)
    const supabase = createClient()

    // Pass all profile fields via metadata — the DB trigger reads from raw_user_meta_data
    const { error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          business_name: data.businessName,
          abn: data.abn || null,
        },
      },
    })

    if (authError) {
      setError(authError.message)
      return
    }

    setSuccess(true)
  }

  if (success) {
    return (
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          Check your email for a confirmation link to complete your signup.
        </p>
        <Button variant="ghost" onClick={() => router.push('/login')}>
          Back to login
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          placeholder="Jane Smith"
          autoComplete="name"
          {...register('fullName')}
        />
        {errors.fullName && (
          <p className="text-sm text-destructive">{errors.fullName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          {...register('email')}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          {...register('password')}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="businessName">Business Name</Label>
        <Input
          id="businessName"
          placeholder="Smith Plumbing"
          {...register('businessName')}
        />
        {errors.businessName && (
          <p className="text-sm text-destructive">{errors.businessName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="abn">ABN (optional)</Label>
        <Input
          id="abn"
          placeholder="12345678901"
          maxLength={11}
          {...register('abn')}
        />
        {errors.abn && (
          <p className="text-sm text-destructive">{errors.abn.message}</p>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}

      <Button type="submit" className="w-full h-11" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="animate-spin" />}
        Create Account
      </Button>
    </form>
  )
}
