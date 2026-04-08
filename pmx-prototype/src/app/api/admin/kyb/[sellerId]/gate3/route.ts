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
    const { session_date, session_notes } = body

    if (!session_date || !session_notes) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_FIELDS', message: 'session_date and session_notes are required' } },
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

    if (manufacturer.kyb_gate !== 'GATE_3') {
      return NextResponse.json(
        { success: false, error: { code: 'WRONG_GATE', message: `Seller is at ${manufacturer.kyb_gate}, not GATE_3` } },
        { status: 400 }
      )
    }

    // Record Gate 3 session
    await query(
      `UPDATE manufacturers SET
        gate3_session_date = $1,
        gate3_session_notes = $2,
        gate3_compliance_officer = $3,
        kyb_gate = 'GATE_4',
        updated_at = NOW()
       WHERE id = $4`,
      [session_date, session_notes, user.id, sellerId]
    )

    // Notify seller admins
    const sellerAdmins = await query(
      `SELECT id FROM users WHERE manufacturer_id = $1 AND role = 'SELLER_ADMIN'`,
      [sellerId]
    )
    for (const admin of sellerAdmins.rows) {
      await createNotification(admin.id, 'KYB_GATE_APPROVED', {
        title: 'Gate 3 Compliance Session Complete',
        body: 'Your compliance session has been recorded. Please complete Gate 4 self-service checklist.',
        link: '/seller/onboarding',
        relatedEntityType: 'manufacturer',
        relatedEntityId: sellerId,
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        seller_id: sellerId,
        gate3_session_date: session_date,
        gate3_session_notes: session_notes,
        compliance_officer: user.full_name,
        advanced_to: 'GATE_4',
      },
    })
  } catch (error) {
    console.error('Gate 3 session error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
