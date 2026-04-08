import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { getAuthUser, comparePassword } from '@/lib/auth'
import crypto from 'crypto'

const VALID_TRANSITIONS: Record<string, string[]> = {
  OPEN: ['INVESTIGATING'],
  INVESTIGATING: ['RESOLVED'],
  RESOLVED: ['CLOSED'],
  CLOSED: [],
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; devId: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const { id, devId } = await params
    const body = await request.json()
    const { new_status, password, signature_meaning, investigation_notes, resolution } = body

    // Validate required fields
    if (!new_status || !password || !signature_meaning) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_FIELDS', message: 'new_status, password, and signature_meaning are required (21 CFR Part 11)' } },
        { status: 400 }
      )
    }

    // Verify password (21 CFR Part 11 e-signature)
    const userRecord = await queryOne<any>(
      `SELECT password_hash FROM users WHERE id = $1`,
      [user.id]
    )
    const validPassword = await comparePassword(password, userRecord.password_hash)
    if (!validPassword) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_PASSWORD', message: 'Password verification failed' } },
        { status: 401 }
      )
    }

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

    // Get the deviation
    const deviation = await queryOne<any>(
      `SELECT * FROM batch_deviations WHERE id = $1 AND batch_id = $2`,
      [devId, id]
    )

    if (!deviation) {
      return NextResponse.json(
        { success: false, error: { code: 'DEVIATION_NOT_FOUND', message: 'Deviation not found for this batch' } },
        { status: 404 }
      )
    }

    // Validate status transition
    const currentStatus = deviation.status || 'OPEN'
    const allowedTransitions = VALID_TRANSITIONS[currentStatus] || []
    if (!allowedTransitions.includes(new_status.toUpperCase())) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_TRANSITION', message: `Cannot transition from ${currentStatus} to ${new_status}. Allowed: ${allowedTransitions.join(', ') || 'none'}` } },
        { status: 400 }
      )
    }

    // Require resolution text when resolving or closing
    if (['RESOLVED', 'CLOSED'].includes(new_status.toUpperCase()) && !resolution) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_FIELDS', message: 'resolution is required when resolving or closing a deviation' } },
        { status: 400 }
      )
    }

    // Create 21 CFR Part 11 compliant signature hash
    const signatureData = `${user.id}|${user.full_name}|${signature_meaning}|${devId}|${new_status}|${new Date().toISOString()}`
    const signatureHash = crypto.createHash('sha256').update(signatureData).digest('hex')

    // Build update query dynamically
    const updates: string[] = [
      'status = $1',
      'signed_by = $2',
      'signed_at = NOW()',
      'signer_full_name = $3',
      'signature_meaning = $4',
      'signature_hash = $5',
    ]
    const values: any[] = [
      new_status.toUpperCase(),
      user.id,
      user.full_name,
      signature_meaning,
      signatureHash,
    ]
    let paramIdx = 6

    if (investigation_notes) {
      updates.push(`investigation_notes = $${paramIdx}`)
      values.push(investigation_notes)
      paramIdx++
    }

    if (resolution) {
      updates.push(`resolution = $${paramIdx}`)
      values.push(resolution)
      paramIdx++
    }

    // Set closed_at when resolving or closing
    if (['RESOLVED', 'CLOSED'].includes(new_status.toUpperCase())) {
      updates.push('closed_at = NOW()')
    }

    values.push(devId)

    const result = await query(
      `UPDATE batch_deviations SET ${updates.join(', ')} WHERE id = $${paramIdx} RETURNING *`,
      values
    )

    // Check if all Critical/Major deviations are resolved and batch is QUARANTINE
    // If so, auto-return batch to IN_PROGRESS
    let batchStatusChanged = false
    if (batch.status === 'QUARANTINE' && ['RESOLVED', 'CLOSED'].includes(new_status.toUpperCase())) {
      const openCriticalMajor = await queryOne<any>(
        `SELECT COUNT(*) as cnt FROM batch_deviations
         WHERE batch_id = $1 AND severity IN ('CRITICAL', 'MAJOR')
         AND (status IS NULL OR status NOT IN ('RESOLVED', 'CLOSED'))`,
        [id]
      )

      if (parseInt(openCriticalMajor.cnt) === 0) {
        await query(
          `UPDATE batches SET status = 'IN_PROGRESS', updated_at = NOW() WHERE id = $1`,
          [id]
        )
        batchStatusChanged = true
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...result.rows[0],
        signature: {
          signed_by: user.full_name,
          signed_at: new Date().toISOString(),
          meaning: signature_meaning,
          hash: signatureHash,
        },
        batch_status_changed: batchStatusChanged,
        batch_new_status: batchStatusChanged ? 'IN_PROGRESS' : batch.status,
      },
    })
  } catch (error) {
    console.error('Deviation update error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
