import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { checkOrderTimeouts } from '@/lib/timeout-checker'

export async function POST(request: NextRequest) {
  try {
    // Allow either PMX_ADMIN or a cron secret header
    const cronSecret = request.headers.get('x-cron-secret')
    const isAuthorizedCron = cronSecret === process.env.CRON_SECRET

    if (!isAuthorizedCron) {
      const user = await getAuthUser()
      if (!user || user.role !== 'PMX_ADMIN') {
        return NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: 'PMX Admin or valid cron secret required' } },
          { status: 403 }
        )
      }
    }

    const results = await checkOrderTimeouts()

    return NextResponse.json({
      success: true,
      data: {
        run_at: new Date().toISOString(),
        archived: results.archived.length,
        archived_ids: results.archived,
        cancelled: results.cancelled.length,
        cancelled_ids: results.cancelled,
        auto_released: results.autoReleased.length,
        auto_released_ids: results.autoReleased,
      },
    })
  } catch (error) {
    console.error('Timeout checker error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
