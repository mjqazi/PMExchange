import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function POST(
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

    if (user.role !== 'PMX_ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'PMX Admin access required' } },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const { kyb_notes } = body

    const buyer = await queryOne<any>(`SELECT * FROM buyers WHERE id = $1`, [id])
    if (!buyer) {
      return NextResponse.json(
        { success: false, error: { code: 'BUYER_NOT_FOUND', message: 'Buyer not found' } },
        { status: 404 }
      )
    }

    await query(
      `UPDATE buyers SET verification_status = 'VERIFIED', kyb_verified_by = $1, kyb_verified_at = NOW(), kyb_notes = $2
       WHERE id = $3`,
      [user.id, kyb_notes || null, id]
    )

    return NextResponse.json({
      success: true,
      data: {
        buyer_id: id,
        verification_status: 'VERIFIED',
        verified_by: user.full_name,
      },
    })
  } catch (error) {
    console.error('Buyer verify error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
