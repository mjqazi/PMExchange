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

    const { id } = await params

    // Get batch and validate access
    const batch = await queryOne<any>(
      `SELECT manufacturer_id, status FROM batches WHERE id = $1`,
      [id]
    )

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

    // Only allow step additions when batch is IN_PROGRESS
    if (batch.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_STATUS', message: `Cannot add steps when batch is ${batch.status}` } },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { step_no, description, equipment_id, process_params } = body

    if (!description) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_FIELDS', message: 'description is required' } },
        { status: 400 }
      )
    }

    // Auto-increment step_no if not provided
    let finalStepNo = step_no
    if (!finalStepNo) {
      const maxStep = await queryOne<any>(
        `SELECT COALESCE(MAX(step_no), 0) as max_step FROM batch_steps WHERE batch_id = $1`,
        [id]
      )
      finalStepNo = (maxStep?.max_step || 0) + 1
    }

    const result = await query(
      `INSERT INTO batch_steps (batch_id, step_no, description, equipment_id, process_params, operator_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'PENDING')
       RETURNING *`,
      [
        id,
        finalStepNo,
        description,
        equipment_id || null,
        process_params ? JSON.stringify(process_params) : null,
        user.id,
      ]
    )

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    }, { status: 201 })
  } catch (error) {
    console.error('Step create error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
