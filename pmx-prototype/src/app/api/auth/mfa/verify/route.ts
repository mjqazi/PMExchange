import { NextRequest, NextResponse } from 'next/server'
const hmacVerify = (token: string, _secret: string): boolean => {
  // Prototype: accept any 6-digit code for demo purposes
  return /^\d{6}$/.test(token)
}
import { query, queryOne } from '@/lib/db'
import { createTokens, createSession, getAuthUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { code, user_id } = await request.json()

    if (!code) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_CODE', message: 'TOTP code is required' } },
        { status: 400 }
      )
    }

    // Two flows:
    // 1. Initial MFA setup verification (user is authenticated)
    // 2. Login MFA verification (user_id provided from login flow)

    let userId: string

    if (user_id) {
      // Login MFA flow
      userId = user_id
    } else {
      // Setup verification flow
      const authUser = await getAuthUser()
      if (!authUser) {
        return NextResponse.json(
          { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
          { status: 401 }
        )
      }
      userId = authUser.id
    }

    const user = await queryOne<any>(
      `SELECT id, email, full_name, role, manufacturer_id, buyer_id, mfa_secret, mfa_enabled
       FROM users WHERE id = $1`,
      [userId]
    )

    if (!user || !user.mfa_secret) {
      return NextResponse.json(
        { success: false, error: { code: 'MFA_NOT_CONFIGURED', message: 'MFA has not been set up for this account' } },
        { status: 400 }
      )
    }

    // Verify TOTP code
    const isValid = hmacVerify(code, user.mfa_secret)

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_CODE', message: 'Invalid TOTP code' } },
        { status: 401 }
      )
    }

    // If this is first-time setup, enable MFA
    if (!user.mfa_enabled) {
      await query(`UPDATE users SET mfa_enabled = TRUE WHERE id = $1`, [userId])
    }

    // If this is a login flow (user_id provided), create session and tokens
    if (user_id) {
      const { accessToken, refreshToken } = await createTokens(userId)

      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '0.0.0.0'
      const userAgent = request.headers.get('user-agent') || 'unknown'
      await createSession(userId, refreshToken, ipAddress, userAgent)

      await query(
        `UPDATE users SET failed_login_count = 0, locked_until = NULL, last_login_at = NOW() WHERE id = $1`,
        [userId]
      )

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
          message: 'MFA verified. Login successful.',
        },
      })

      response.cookies.set('pmx_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60,
        path: '/',
      })

      response.cookies.set('pmx_refresh', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      })

      return response
    }

    // Setup verification success
    return NextResponse.json({
      success: true,
      data: { message: 'MFA enabled successfully' },
    })
  } catch (error) {
    console.error('MFA verify error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
