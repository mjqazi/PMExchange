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

    const batch = await queryOne<any>(
      `SELECT manufacturer_id FROM batches WHERE id = $1`,
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

    const deviations = await query(
      `SELECT d.*, u.full_name as reported_by_name
       FROM batch_deviations d
       LEFT JOIN users u ON d.reported_by = u.id
       WHERE d.batch_id = $1
       ORDER BY d.reported_at DESC`,
      [id]
    )

    return NextResponse.json({
      success: true,
      data: deviations.rows,
    })
  } catch (error) {
    console.error('Deviations GET error:', error)
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

    // Allow deviation reporting when batch is IN_PROGRESS or QA_REVIEW
    if (!['IN_PROGRESS', 'QA_REVIEW'].includes(batch.status)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_STATUS', message: `Cannot report deviations when batch is ${batch.status}` } },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { description, severity, capa_ref, affected_step_id } = body

    if (!description || !severity) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_FIELDS', message: 'description and severity are required' } },
        { status: 400 }
      )
    }

    if (!['CRITICAL', 'MAJOR', 'MINOR'].includes(severity.toUpperCase())) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_SEVERITY', message: 'severity must be CRITICAL, MAJOR, or MINOR' } },
        { status: 400 }
      )
    }

    // If affected_step_id provided, validate it belongs to this batch
    if (affected_step_id) {
      const step = await queryOne<any>(
        `SELECT id FROM batch_steps WHERE id = $1 AND batch_id = $2`,
        [affected_step_id, id]
      )
      if (!step) {
        return NextResponse.json(
          { success: false, error: { code: 'STEP_NOT_FOUND', message: 'Affected step not found for this batch' } },
          { status: 400 }
        )
      }
    }

    const result = await query(
      `INSERT INTO batch_deviations (batch_id, description, severity, capa_ref, affected_step_id, reported_by, reported_at, status)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), 'OPEN')
       RETURNING *`,
      [
        id,
        description,
        severity.toUpperCase(),
        capa_ref || null,
        affected_step_id || null,
        user.id,
      ]
    )

    // On CRITICAL severity: auto-change batch status to QUARANTINE
    if (severity.toUpperCase() === 'CRITICAL') {
      await query(
        `UPDATE batches SET status = 'QUARANTINE', updated_at = NOW() WHERE id = $1`,
        [id]
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        ...result.rows[0],
        batch_quarantined: severity.toUpperCase() === 'CRITICAL',
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Deviation create error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
