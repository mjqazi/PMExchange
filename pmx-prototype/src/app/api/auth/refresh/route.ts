import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { query, queryOne } from '@/lib/db'
import { verifyRefreshToken, createTokens } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const refreshToken = cookieStore.get('pmx_refresh')?.value

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_REFRESH_TOKEN', message: 'No refresh token provided' } },
        { status: 401 }
      )
    }

    // Verify refresh token
    const { userId } = await verifyRefreshToken(refreshToken)

    // Verify user still exists and is active
    const user = await queryOne<any>(
      `SELECT id, email, full_name, role, manufacturer_id, buyer_id, status
       FROM users WHERE id = $1 AND status = 'ACTIVE'`,
      [userId]
    )

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found or inactive' } },
        { status: 401 }
      )
    }

    // Verify session exists
    const session = await queryOne(
      `SELECT id FROM active_sessions WHERE user_id = $1 AND expires_at > NOW() LIMIT 1`,
      [userId]
    )

    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'SESSION_EXPIRED', message: 'Session has expired. Please login again.' } },
        { status: 401 }
      )
    }

    // Issue new access token
    const { accessToken } = await createTokens(user.id)

    // Update session last_used_at
    await query(
      `UPDATE active_sessions SET last_used_at = NOW() WHERE user_id = $1 AND expires_at > NOW()`,
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
      },
    })

    response.cookies.set('pmx_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Token refresh error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid or expired refresh token' } },
      { status: 401 }
    )
  }
}
