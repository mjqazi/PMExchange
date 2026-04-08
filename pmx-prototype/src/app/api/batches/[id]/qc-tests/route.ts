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

    const batch = await queryOne<any>(`SELECT manufacturer_id FROM batches WHERE id = $1`, [id])
    if (!batch) {
      return NextResponse.json(
        { success: false, error: { code: 'BATCH_NOT_FOUND', message: 'Batch not found' } },
        { status: 404 }
      )
    }

    if (user.manufacturer_id && user.manufacturer_id !== batch.manufacturer_id) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      )
    }

    const tests = await query(
      `SELECT t.*, u.full_name as analyst_name
       FROM batch_qc_tests t
       LEFT JOIN users u ON t.analyst_id = u.id
       WHERE t.batch_id = $1 ORDER BY t.test_name`,
      [id]
    )

    return NextResponse.json({
      success: true,
      data: tests.rows,
    })
  } catch (error) {
    console.error('QC tests GET error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}

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

    if (!['SELLER_QA', 'SELLER_ADMIN', 'PMX_ADMIN'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only QA or Admin can add QC tests' } },
        { status: 403 }
      )
    }

    const { id } = await params

    const batch = await queryOne<any>(`SELECT manufacturer_id, status FROM batches WHERE id = $1`, [id])
    if (!batch) {
      return NextResponse.json(
        { success: false, error: { code: 'BATCH_NOT_FOUND', message: 'Batch not found' } },
        { status: 404 }
      )
    }

    if (user.manufacturer_id && user.manufacturer_id !== batch.manufacturer_id) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      )
    }

    if (batch.status === 'RELEASED') {
      return NextResponse.json(
        { success: false, error: { code: 'BATCH_RELEASED', message: 'Cannot add tests to a released batch' } },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { test_name, method_reference, specification, result_value, result_unit, pass_fail, notes } = body

    if (!test_name || !specification || !result_value || !pass_fail) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_FIELDS', message: 'test_name, specification, result_value, and pass_fail are required' } },
        { status: 400 }
      )
    }

    if (!['PASS', 'FAIL'].includes(pass_fail)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_RESULT', message: 'pass_fail must be PASS or FAIL' } },
        { status: 400 }
      )
    }

    const result = await query(
      `INSERT INTO batch_qc_tests (batch_id, test_name, method_reference, specification, result_value, result_unit, pass_fail, analyst_id, tested_at, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9)
       RETURNING *`,
      [id, test_name, method_reference || null, specification, result_value, result_unit || null, pass_fail, user.id, notes || null]
    )

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    }, { status: 201 })
  } catch (error) {
    console.error('QC test create error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
