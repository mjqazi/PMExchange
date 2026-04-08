import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { query } from '@/lib/db'
import { verifyAccessToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('pmx_token')?.value

    if (token) {
      try {
        const { userId } = await verifyAccessToken(token)
        // Delete all sessions for user (or just the current one based on refresh token)
        const refreshToken = cookieStore.get('pmx_refresh')?.value
        if (refreshToken) {
          // Delete matching session
          await query(
            `DELETE FROM active_sessions WHERE user_id = $1 AND created_at = (
              SELECT created_at FROM active_sessions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1
            )`,
            [userId]
          )
        }
      } catch {
        // Token invalid/expired - still clear cookies
      }
    }

    const response = NextResponse.json({
      success: true,
      data: { message: 'Logged out successfully' },
    })

    response.cookies.set('pmx_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })

    response.cookies.set('pmx_refresh', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
