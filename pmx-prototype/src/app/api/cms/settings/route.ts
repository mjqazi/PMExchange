import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }
    if (user.role !== 'PMX_ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'PMX Admin access required' } },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const group = searchParams.get('group')

    let sql = `SELECT * FROM cms_settings`
    const params: unknown[] = []

    if (group) {
      sql += ` WHERE group_name = $1`
      params.push(group)
    }

    sql += ` ORDER BY group_name, key`

    const result = await query(sql, params)

    return NextResponse.json({ success: true, data: result.rows })
  } catch (error) {
    console.error('List CMS settings error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }
    if (user.role !== 'PMX_ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'PMX Admin access required' } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { settings } = body

    if (!settings || !Array.isArray(settings)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_BODY', message: 'settings must be an array of { key, value } objects' } },
        { status: 400 }
      )
    }

    const updated: Record<string, unknown>[] = []

    for (const setting of settings) {
      if (!setting.key || setting.value === undefined) continue

      const result = await query(
        `UPDATE cms_settings SET value = $1, updated_at = NOW() WHERE key = $2 RETURNING *`,
        [String(setting.value), setting.key]
      )

      if (result.rows.length > 0) {
        updated.push(result.rows[0])
      }
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Update CMS settings error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
