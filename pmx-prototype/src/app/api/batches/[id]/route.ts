import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

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

    // Get batch with product info
    const batch = await queryOne<any>(
      `SELECT b.*,
              p.inn_name as product_inn, p.brand_name, p.strength, p.dosage_form, p.drap_reg_no,
              m.company_name as manufacturer_name, m.drap_licence_no
       FROM batches b
       JOIN products p ON b.product_id = p.id
       JOIN manufacturers m ON b.manufacturer_id = m.id
       WHERE b.id = $1`,
      [id]
    )

    if (!batch) {
      return NextResponse.json(
        { success: false, error: { code: 'BATCH_NOT_FOUND', message: 'Batch not found' } },
        { status: 404 }
      )
    }

    // Access control: seller can only see own batches
    if (user.manufacturer_id && user.manufacturer_id !== batch.manufacturer_id) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      )
    }

    // Get materials, steps, QC tests, environmental records, deviations in parallel
    const [materials, steps, qcTests, environmental, deviations] = await Promise.all([
      query(`SELECT * FROM batch_materials WHERE batch_id = $1 ORDER BY material_type, material_name`, [id]),
      query(`SELECT * FROM batch_steps WHERE batch_id = $1 ORDER BY step_no`, [id]),
      query(`SELECT * FROM batch_qc_tests WHERE batch_id = $1 ORDER BY test_name`, [id]),
      query(`SELECT * FROM batch_environmental WHERE batch_id = $1 ORDER BY recorded_at DESC`, [id]),
      query(`SELECT * FROM batch_deviations WHERE batch_id = $1 ORDER BY reported_at DESC`, [id]),
    ])

    return NextResponse.json({
      success: true,
      data: {
        ...batch,
        materials: materials.rows,
        steps: steps.rows,
        qc_tests: qcTests.rows,
        environmental: environmental.rows,
        deviations: deviations.rows,
      },
    })
  } catch (error) {
    console.error('Batch detail error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
