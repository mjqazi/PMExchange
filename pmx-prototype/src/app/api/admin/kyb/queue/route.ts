import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const gate = searchParams.get('gate')

    let sql = `SELECT m.id, m.company_name, m.drap_licence_no, m.kyb_gate, m.status,
                      m.tier, m.city, m.created_at,
                      (SELECT COUNT(*) FROM onboarding_documents WHERE manufacturer_id = m.id) as doc_count,
                      (SELECT MAX(uploaded_at) FROM onboarding_documents WHERE manufacturer_id = m.id) as last_doc_upload
               FROM manufacturers m
               WHERE m.kyb_gate NOT IN ('APPROVED', 'REJECTED')`
    const params: any[] = []

    if (gate) {
      sql += ` AND m.kyb_gate = $1`
      params.push(gate)
    }

    sql += ` ORDER BY m.created_at ASC`

    const result = await query(sql, params)

    return NextResponse.json({
      success: true,
      data: result.rows,
    })
  } catch (error) {
    console.error('KYB queue error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
