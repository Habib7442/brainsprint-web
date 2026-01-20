import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/dashboard'
  const code = searchParams.get('code')

  console.log('🔐 Auth Callback - Code:', code ? 'Present' : 'Missing')

  const supabase = await createClient()

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url))
    }
    console.error('❌ OTP Verification Error:', error)
  } else if (code) {
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('❌ Code Exchange Error:', error)
      return NextResponse.redirect(new URL('/auth/auth-code-error', request.url))
    }

    if (data?.user) {
      console.log('✅ User authenticated successfully')


      // Check if user exists in public table
      const { data: existingUser, error: selectError } = await supabase
        .from('users')
        .select('id')
        .eq('id', data.user.id)
        .single()

      if (selectError && selectError.code !== 'PGRST116') {
        console.error('❌ Error checking existing user:', selectError)
      }

      // If not, insert them
      if (!existingUser) {
        console.log('➕ Creating new user profile...')
        
        const { error: insertError } = await supabase.from('users').insert({
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata.full_name || data.user.user_metadata.name || data.user.email?.split('@')[0],
          avatar_url: data.user.user_metadata.avatar_url || data.user.user_metadata.picture,
          total_xp: 0,
          current_level: 1,
          current_streak: 0
        })

        if (insertError) {
          console.error('❌ User Insert Error:', insertError)
          console.error('❌ Insert Error Details:', JSON.stringify(insertError, null, 2))
        } else {
          console.log('✅ User profile created successfully!')
        }
      } else {
        console.log('ℹ️ User profile already exists')
      }

      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  console.error('❌ Auth callback failed - no valid auth method')
  return NextResponse.redirect(new URL('/auth/auth-code-error', request.url))
}
