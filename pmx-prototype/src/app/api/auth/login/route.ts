import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { createTokens, createSession, handleLoginFailure, comparePassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_FIELDS', message: 'Email and password are required' } },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await queryOne<any>(
      `SELECT id, email, password_hash, full_name, role, manufacturer_id, buyer_id, status,
              mfa_enabled, failed_login_count, locked_until
       FROM users WHERE email = $1`,
      [email.toLowerCase().trim()]
    )

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } },
        { status: 401 }
      )
    }

    // Check lockout
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const minutesLeft = Math.ceil((new Date(user.locked_until).getTime() - Date.now()) / 60000)
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ACCOUNT_LOCKED',
            message: `Account locked. Try again in ${minutesLeft} minute(s).`,
          },
        },
        { status: 423 }
      )
    }

    // Check account status
    if (user.status === 'SUSPENDED') {
      return NextResponse.json(
        { success: false, error: { code: 'ACCOUNT_SUSPENDED', message: 'Account has been suspended. Contact PMX admin.' } },
        { status: 403 }
      )
    }

    // Verify password
    const validPassword = await comparePassword(password, user.password_hash)
    if (!validPassword) {
      const ipAddress = (request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '0.0.0.0').split(',')[0].trim()
      await handleLoginFailure(user.id, ipAddress)
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } },
        { status: 401 }
      )
    }

    // Check if MFA is enabled and required
    if (user.mfa_enabled) {
      // Return a partial response indicating MFA is required
      // Create a temporary short-lived token for MFA verification
      return NextResponse.json({
        success: true,
        data: {
          mfa_required: true,
          user_id: user.id,
          message: 'MFA verification required. Send TOTP code to /api/auth/mfa/verify.',
        },
      })
    }

    // Create tokens
    const { accessToken, refreshToken } = await createTokens(user.id)

    // Create session
    const ipAddress = (request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '0.0.0.0').split(',')[0].trim()
    const userAgent = request.headers.get('user-agent') || 'unknown'
    await createSession(user.id, refreshToken, ipAddress, userAgent)

    // Reset failed login count and update last_login_at
    await query(
      `UPDATE users SET failed_login_count = 0, locked_until = NULL, last_login_at = NOW() WHERE id = $1`,
      [user.id]
    )

    // Set httpOnly cookie with access token
    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          manufacturer_id: user.manufacturer_id,
          buyer_id: user.buyer_id,
        },
        accessToken,
      },
    })

    response.cookies.set('pmx_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour
      path: '/',
    })

    response.cookies.set('pmx_refresh', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
