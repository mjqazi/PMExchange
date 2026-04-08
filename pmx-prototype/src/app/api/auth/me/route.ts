import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAccessToken } from '@/lib/auth'
import { queryOne } from '@/lib/db'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('pmx_token')?.value

    if (!token) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_AUTHENTICATED', message: 'No valid session' } },
        { status: 401 }
      )
    }

    const { userId } = await verifyAccessToken(token)

    const user = await queryOne<{
      id: string
      email: string
      full_name: string
      role: string
      manufacturer_id: string | null
      buyer_id: string | null
      manufacturer_name: string | null
      buyer_name: string | null
    }>(
      `SELECT u.id, u.email, u.full_name, u.role,
              u.manufacturer_id, u.buyer_id,
              m.company_name AS manufacturer_name,
              b.company_name AS buyer_name
       FROM users u
       LEFT JOIN manufacturers m ON m.id = u.manufacturer_id
       LEFT JOIN buyers b ON b.id = u.buyer_id
       WHERE u.id = $1 AND u.status = 'ACTIVE'`,
      [userId]
    )

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found or inactive' } },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        manufacturer_id: user.manufacturer_id,
        buyer_id: user.buyer_id,
        manufacturer_name: user.manufacturer_name,
        buyer_name: user.buyer_name,
      },
    })
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_AUTHENTICATED', message: 'Invalid or expired token' } },
      { status: 401 }
    )
  }
}
