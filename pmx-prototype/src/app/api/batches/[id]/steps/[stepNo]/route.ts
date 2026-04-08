import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { getAuthUser, comparePassword } from '@/lib/auth'
import crypto from 'crypto'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stepNo: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const { id, stepNo } = await params
    const body = await request.json()
    const { password, signature_meaning, process_params, equipment_id } = body

    if (!password || !signature_meaning) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_FIELDS', message: 'Password and signature meaning are required (21 CFR Part 11 e-signature)' } },
        { status: 400 }
      )
    }

    // Verify password for e-signature
    const userRecord = await queryOne<any>(`SELECT password_hash FROM users WHERE id = $1`, [user.id])
    const validPassword = await comparePassword(password, userRecord.password_hash)
    if (!validPassword) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_PASSWORD', message: 'Password verification failed for e-signature' } },
        { status: 401 }
      )
    }

    // Get the batch and verify access
    const batch = await queryOne<any>(`SELECT id, manufacturer_id, status FROM batches WHERE id = $1`, [id])
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
        { success: false, error: { code: 'BATCH_RELEASED', message: 'Cannot modify a released batch' } },
        { status: 400 }
      )
    }

    // Get the step
    const step = await queryOne<any>(
      `SELECT * FROM batch_steps WHERE batch_id = $1 AND step_no = $2`,
      [id, parseInt(stepNo)]
    )

    if (!step) {
      return NextResponse.json(
        { success: false, error: { code: 'STEP_NOT_FOUND', message: `Step ${stepNo} not found` } },
        { status: 404 }
      )
    }

    if (step.signed_by) {
      return NextResponse.json(
        { success: false, error: { code: 'ALREADY_SIGNED', message: 'This step has already been signed' } },
        { status: 409 }
      )
    }

    // Create 21 CFR Part 11 compliant signature
    const signatureData = `${user.id}|${user.full_name}|${signature_meaning}|${step.step_no}|${id}|${new Date().toISOString()}`
    const signatureHash = crypto.createHash('sha256').update(signatureData).digest('hex')

    // Update step with signature and completion
    await query(
      `UPDATE batch_steps SET
        operator_id = COALESCE(operator_id, $1),
        equipment_id = COALESCE($2, equipment_id),
        process_params = COALESCE($3, process_params),
        completed_at = NOW(),
        status = 'COMPLETED',
        signed_by = $1,
        signed_at = NOW(),
        signer_full_name = $4,
        signature_meaning = $5,
        signature_hash = $6
       WHERE batch_id = $7 AND step_no = $8`,
      [
        user.id,
        equipment_id || null,
        process_params ? JSON.stringify(process_params) : null,
        user.full_name,
        signature_meaning,
        signatureHash,
        id,
        parseInt(stepNo),
      ]
    )

    return NextResponse.json({
      success: true,
      data: {
        batch_id: id,
        step_no: parseInt(stepNo),
        signed_by: user.full_name,
        signed_at: new Date().toISOString(),
        signature_meaning,
        signature_hash: signatureHash,
        status: 'COMPLETED',
      },
    })
  } catch (error) {
    console.error('Step sign error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
