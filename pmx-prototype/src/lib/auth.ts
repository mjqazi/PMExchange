import { SignJWT, jwtVerify } from 'jose'
import { hash, compare } from 'bcryptjs'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import { query, queryOne } from './db'
import type { User, UserRole, UserStatus } from './types'

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'pmx-prototype-secret-key-minimum-32-chars-long'
)

// ─── Subset returned by getAuthUser (no password_hash) ──────────────────────

export interface AuthUser {
  id: string
  email: string
  full_name: string
  role: UserRole
  manufacturer_id: string | null
  buyer_id: string | null
  status: UserStatus
  mfa_enabled: boolean
}

// ─── Token Creation ─────────────────────────────────────────────────────────

export async function createTokens(userId: string) {
  const accessToken = await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1h')
    .sign(SECRET)

  const refreshToken = await new SignJWT({ userId, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(SECRET)

  return { accessToken, refreshToken }
}

// ─── Token Verification ─────────────────────────────────────────────────────

export async function verifyAccessToken(
  token: string
): Promise<{ userId: string }> {
  const { payload } = await jwtVerify(token, SECRET)
  return payload as { userId: string }
}

export async function verifyRefreshToken(
  token: string
): Promise<{ userId: string; type: string }> {
  const { payload } = await jwtVerify(token, SECRET)
  if ((payload as Record<string, unknown>).type !== 'refresh')
    throw new Error('Not a refresh token')
  return payload as { userId: string; type: string }
}

// ─── Auth User Helpers ──────────────────────────────────────────────────────

/**
 * Server Component variant: reads the JWT from the cookie jar (next/headers).
 */
export async function getAuthUser(): Promise<AuthUser | null>
/**
 * API Route / Middleware variant: reads the JWT from the request cookie.
 */
export async function getAuthUser(
  request: NextRequest
): Promise<AuthUser | null>
export async function getAuthUser(
  request?: NextRequest
): Promise<AuthUser | null> {
  try {
    let token: string | undefined

    if (request) {
      // API route / middleware path
      token = request.cookies.get('pmx_token')?.value
    } else {
      // Server component path
      const cookieStore = await cookies()
      token = cookieStore.get('pmx_token')?.value
    }

    if (!token) return null

    const { userId } = await verifyAccessToken(token)

    const user = await queryOne<AuthUser>(
      `SELECT id, email, full_name, role, manufacturer_id, buyer_id, status, mfa_enabled
       FROM users WHERE id = $1 AND status = 'ACTIVE'`,
      [userId]
    )

    return user
  } catch {
    return null
  }
}

// ─── Session Management (3-session limit) ───────────────────────────────────

export async function createSession(
  userId: string,
  refreshToken: string,
  ipAddress: string,
  userAgent: string
) {
  // Enforce 3-session limit: remove oldest if at limit
  const sessions = await query(
    `SELECT id FROM active_sessions WHERE user_id = $1 AND expires_at > NOW() ORDER BY created_at ASC`,
    [userId]
  )
  if (sessions.rows.length >= 3) {
    await query(`DELETE FROM active_sessions WHERE id = $1`, [
      sessions.rows[0].id,
    ])
  }

  const tokenHash = await hash(refreshToken, 10)
  await query(
    `INSERT INTO active_sessions (user_id, refresh_token_hash, ip_address, user_agent, expires_at)
     VALUES ($1, $2, $3, $4, NOW() + INTERVAL '30 days')`,
    [userId, tokenHash, ipAddress, userAgent]
  )
}

export async function invalidateSession(
  userId: string,
  refreshTokenHash: string
) {
  await query(
    `DELETE FROM active_sessions WHERE user_id = $1 AND refresh_token_hash = $2`,
    [userId, refreshTokenHash]
  )
}

export async function invalidateAllSessions(userId: string) {
  await query(`DELETE FROM active_sessions WHERE user_id = $1`, [userId])
}

// ─── Login Failure Handling (5-attempt, 15-min lockout) ─────────────────────

export async function handleLoginFailure(userId: string, ipAddress: string) {
  const result = await query(
    `UPDATE users SET failed_login_count = failed_login_count + 1,
      locked_until = CASE WHEN failed_login_count + 1 >= 5 THEN NOW() + INTERVAL '15 minutes' ELSE locked_until END
     WHERE id = $1 RETURNING failed_login_count, email`,
    [userId]
  )
  const { failed_login_count, email } = result.rows[0]

  if (failed_login_count >= 5) {
    const admins = await query(
      `SELECT id FROM users WHERE role = 'PMX_ADMIN' AND status = 'ACTIVE'`
    )
    const { createNotification } = await import('./notifications')
    for (const admin of admins.rows) {
      await createNotification(admin.id, 'ACCOUNT_SUSPENDED', {
        title: 'Login lockout triggered',
        body: `User ${email} locked after 5 failed attempts from ${ipAddress}`,
        link: '/admin/sellers',
      })
    }
  }
}

export async function resetLoginFailures(userId: string) {
  await query(
    `UPDATE users SET failed_login_count = 0, locked_until = NULL WHERE id = $1`,
    [userId]
  )
}

export async function isAccountLocked(userId: string): Promise<boolean> {
  const result = await queryOne<{ locked_until: string | null }>(
    `SELECT locked_until FROM users WHERE id = $1`,
    [userId]
  )
  if (!result?.locked_until) return false
  return new Date(result.locked_until) > new Date()
}

// ─── Password Utilities ─────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12)
}

export async function comparePassword(
  password: string,
  passwordHash: string
): Promise<boolean> {
  return compare(password, passwordHash)
}

// ─── Role Check ─────────────────────────────────────────────────────────────

export function requireRole(user: AuthUser, ...roles: UserRole[]): boolean {
  return roles.includes(user.role)
}
