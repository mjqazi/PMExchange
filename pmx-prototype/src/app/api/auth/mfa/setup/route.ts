import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const auth = {
  generateSecret: () => crypto.randomBytes(20).toString('hex').substring(0, 20).toUpperCase(),
  keyuri: (email: string, issuer: string, secret: string) =>
    `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`,
}
import { query } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    if (user.mfa_enabled) {
      return NextResponse.json(
        { success: false, error: { code: 'MFA_ALREADY_ENABLED', message: 'MFA is already enabled for this account' } },
        { status: 400 }
      )
    }

    // Generate TOTP secret
    const secret = auth.generateSecret()

    await query(
      `UPDATE users SET mfa_secret = $1 WHERE id = $2`,
      [secret, user.id]
    )

    const otpauthUrl = auth.keyuri(user.email, 'PMX-Marketplace', secret)

    return NextResponse.json({
      success: true,
      data: {
        secret,
        otpauth_url: otpauthUrl,
        message: 'Scan QR code with authenticator app, then verify with /api/auth/mfa/verify',
      },
    })
  } catch (error) {
    console.error('MFA setup error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
