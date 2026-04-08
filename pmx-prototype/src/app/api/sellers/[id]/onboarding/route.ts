import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { GATE_1_DOCS, KYB_CHECKS } from '@/lib/types'

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

    // Verify the user has access to this seller's data
    if (user.role !== 'PMX_ADMIN' && user.manufacturer_id !== id) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      )
    }

    const manufacturer = await queryOne<any>(
      `SELECT id, company_name, kyb_gate, status, pmx_certified, tier,
              bank_account_confirmed, product_count, tos_accepted_at,
              gate3_session_date, gate3_session_notes, gate3_compliance_officer,
              gate2_verification_notes
       FROM manufacturers WHERE id = $1`,
      [id]
    )

    if (!manufacturer) {
      return NextResponse.json(
        { success: false, error: { code: 'SELLER_NOT_FOUND', message: 'Seller not found' } },
        { status: 404 }
      )
    }

    // Gate 1: Document upload status
    const docs = await query(
      `SELECT doc_type, doc_label, file_name, verification_status, uploaded_at
       FROM onboarding_documents WHERE manufacturer_id = $1 AND gate = 'GATE_1'
       ORDER BY uploaded_at`,
      [id]
    )

    const gate1Status = GATE_1_DOCS.map((docDef) => {
      const uploaded = docs.rows.find((d: any) => d.doc_type === docDef.type)
      return {
        ...docDef,
        uploaded: !!uploaded,
        file_name: uploaded?.file_name || null,
        verification_status: uploaded?.verification_status || null,
        uploaded_at: uploaded?.uploaded_at || null,
      }
    })

    // Gate 2: KYB verification checks
    const gate2Status = KYB_CHECKS.map((check) => ({
      ...check,
      status: manufacturer.kyb_gate !== 'GATE_1' ? 'VERIFIED' : 'PENDING',
      verified_at: manufacturer.kyb_gate !== 'GATE_1' ? manufacturer.gate2_verification_notes : null,
    }))

    // Gate 3: Human session
    const gate3Status = {
      session_date: manufacturer.gate3_session_date,
      session_notes: manufacturer.gate3_session_notes,
      compliance_officer: manufacturer.gate3_compliance_officer,
      completed: !!manufacturer.gate3_session_date,
    }

    // Gate 4: Self-service checklist
    const hasQaUser = await queryOne(
      `SELECT 1 FROM users WHERE manufacturer_id = $1 AND role = 'SELLER_QA' AND status = 'ACTIVE'`,
      [id]
    )

    const gate4Status = {
      has_products: manufacturer.product_count >= 1,
      has_qa_user: !!hasQaUser,
      bank_confirmed: manufacturer.bank_account_confirmed,
      tos_accepted: !!manufacturer.tos_accepted_at,
      all_complete: manufacturer.product_count >= 1 && !!hasQaUser && manufacturer.bank_account_confirmed && !!manufacturer.tos_accepted_at,
    }

    return NextResponse.json({
      success: true,
      data: {
        current_gate: manufacturer.kyb_gate,
        status: manufacturer.status,
        pmx_certified: manufacturer.pmx_certified,
        gate1: gate1Status,
        gate2: gate2Status,
        gate3: gate3Status,
        gate4: gate4Status,
      },
    })
  } catch (error) {
    console.error('Onboarding status error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
