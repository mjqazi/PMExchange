import { NextRequest, NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { runMatchingEngine } from '@/lib/matching-engine'

export async function GET(
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

    // Verify RFQ exists and user has access
    const rfq = await queryOne<any>(`SELECT * FROM rfqs WHERE id = $1`, [id])
    if (!rfq) {
      return NextResponse.json(
        { success: false, error: { code: 'RFQ_NOT_FOUND', message: 'RFQ not found' } },
        { status: 404 }
      )
    }

    // Only the RFQ buyer or admin can run matching
    if (user.buyer_id && user.buyer_id !== rfq.buyer_id && user.role !== 'PMX_ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      )
    }

    // Run the 3-layer matching engine
    const matches = await runMatchingEngine(id)

    return NextResponse.json({
      success: true,
      data: {
        rfq_id: id,
        total_matches: matches.filter((m) => m.l1_eligible).length,
        total_evaluated: matches.length,
        matches,
      },
    })
  } catch (error) {
    console.error('Matching engine error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
