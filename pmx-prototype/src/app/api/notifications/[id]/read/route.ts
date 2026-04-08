import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const { id } = await params

    const notification = await queryOne<any>(
      `SELECT id, user_id, read FROM notifications WHERE id = $1`,
      [id]
    )

    if (!notification) {
      return NextResponse.json(
        { success: false, error: { code: 'NOTIFICATION_NOT_FOUND', message: 'Notification not found' } },
        { status: 404 }
      )
    }

    if (notification.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      )
    }

    if (notification.read) {
      return NextResponse.json({
        success: true,
        data: { message: 'Already marked as read' },
      })
    }

    await query(
      `UPDATE notifications SET read = TRUE, read_at = NOW() WHERE id = $1`,
      [id]
    )

    return NextResponse.json({
      success: true,
      data: { message: 'Notification marked as read' },
    })
  } catch (error) {
    console.error('Mark read error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
