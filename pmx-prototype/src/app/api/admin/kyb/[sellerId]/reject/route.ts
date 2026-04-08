import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { createNotification } from '@/lib/notifications'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sellerId: string }> }
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

    const { sellerId } = await params
    const body = await request.json()
    const { reason } = body

    if (!reason) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_REASON', message: 'Rejection reason is required' } },
        { status: 400 }
      )
    }

    const manufacturer = await queryOne<any>(
      `SELECT id, company_name, kyb_gate FROM manufacturers WHERE id = $1`,
      [sellerId]
    )

    if (!manufacturer) {
      return NextResponse.json(
        { success: false, error: { code: 'SELLER_NOT_FOUND', message: 'Seller not found' } },
        { status: 404 }
      )
    }

    const previousGate = manufacturer.kyb_gate

    await query(
      `UPDATE manufacturers SET kyb_gate = 'REJECTED', status = 'SUSPENDED', updated_at = NOW() WHERE id = $1`,
      [sellerId]
    )

    // Notify seller admins
    const sellerAdmins = await query(
      `SELECT id FROM users WHERE manufacturer_id = $1 AND role = 'SELLER_ADMIN'`,
      [sellerId]
    )
    for (const admin of sellerAdmins.rows) {
      await createNotification(admin.id, 'KYB_GATE_REJECTED', {
        title: 'KYB Application Rejected',
        body: `Your application was rejected at ${previousGate}. Reason: ${reason}`,
        link: '/seller/onboarding',
        relatedEntityType: 'manufacturer',
        relatedEntityId: sellerId,
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        seller_id: sellerId,
        previous_gate: previousGate,
        new_gate: 'REJECTED',
        reason,
      },
    })
  } catch (error) {
    console.error('KYB reject error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
