import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { getAuthUser, comparePassword } from '@/lib/auth'
import { generateCoAPDF } from '@/lib/pdf-generator'
import { calculateCQS } from '@/lib/cqs-engine'
import { createNotification } from '@/lib/notifications'
import crypto from 'crypto'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

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

    // Only QA can release batches
    if (!['SELLER_QA', 'PMX_ADMIN'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only QA personnel can release batches' } },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { password, signature_meaning } = body

    if (!password || !signature_meaning) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_FIELDS', message: 'Password and signature meaning are required for batch release (21 CFR Part 11)' } },
        { status: 400 }
      )
    }

    // Verify password (21 CFR Part 11 e-signature)
    const userRecord = await queryOne<any>(`SELECT password_hash FROM users WHERE id = $1`, [user.id])
    const validPassword = await comparePassword(password, userRecord.password_hash)
    if (!validPassword) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_PASSWORD', message: 'Password verification failed' } },
        { status: 401 }
      )
    }

    const batch = await queryOne<any>(
      `SELECT b.*, p.inn_name, p.brand_name, p.strength, p.dosage_form,
              m.id as mfr_id, m.company_name, m.drap_licence_no
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

    if (user.manufacturer_id && user.manufacturer_id !== batch.manufacturer_id) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      )
    }

    if (batch.status === 'RELEASED') {
      return NextResponse.json(
        { success: false, error: { code: 'ALREADY_RELEASED', message: 'Batch has already been released' } },
        { status: 409 }
      )
    }

    if (batch.status === 'QUARANTINE') {
      return NextResponse.json(
        { success: false, error: { code: 'BATCH_QUARANTINED', message: 'Cannot release a quarantined batch. Resolve all deviations first.' } },
        { status: 400 }
      )
    }

    if (batch.status === 'REJECTED') {
      return NextResponse.json(
        { success: false, error: { code: 'BATCH_REJECTED', message: 'Cannot release a rejected batch' } },
        { status: 400 }
      )
    }

    // ── Pre-release validation checklist ──────────────────────────────────
    const validationErrors: { check: string; message: string }[] = []

    // 1. Check at least 1 material exists
    const materialsResult = await query(
      `SELECT COUNT(*) as cnt FROM batch_materials WHERE batch_id = $1`,
      [id]
    )
    if (parseInt(materialsResult.rows[0].cnt) === 0) {
      validationErrors.push({ check: 'materials', message: 'At least 1 material must be added to the Bill of Materials' })
    }

    // 2. Check at least 1 step exists and all steps are signed (COMPLETED)
    const stepsResult = await query(
      `SELECT COUNT(*) as total, COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed
       FROM batch_steps WHERE batch_id = $1`,
      [id]
    )
    const totalSteps = parseInt(stepsResult.rows[0].total)
    const completedSteps = parseInt(stepsResult.rows[0].completed)
    if (totalSteps === 0) {
      validationErrors.push({ check: 'steps', message: 'At least 1 manufacturing step must be added' })
    } else if (completedSteps < totalSteps) {
      validationErrors.push({ check: 'steps_signed', message: `${totalSteps - completedSteps} of ${totalSteps} steps are not yet signed/completed` })
    }

    // 3. Check all required QC tests from template are entered
    const requiredTemplates = await query(
      `SELECT t.test_name FROM product_qc_templates t
       WHERE t.product_id = $1 AND t.required = true
       AND NOT EXISTS (
         SELECT 1 FROM batch_qc_tests q WHERE q.batch_id = $2 AND q.test_name = t.test_name
       )`,
      [batch.product_id, id]
    )
    if (requiredTemplates.rows.length > 0) {
      const missing = requiredTemplates.rows.map((r: any) => r.test_name).join(', ')
      validationErrors.push({ check: 'qc_templates', message: `Required QC tests missing: ${missing}` })
    }

    // 4. Check all QC tests PASS
    const failedTests = await query(
      `SELECT test_name FROM batch_qc_tests WHERE batch_id = $1 AND pass_fail = 'FAIL'`,
      [id]
    )
    if (failedTests.rows.length > 0) {
      const failed = failedTests.rows.map((r: any) => r.test_name).join(', ')
      validationErrors.push({ check: 'qc_results', message: `QC test(s) failed: ${failed}` })
    }

    // 5. Check no OPEN Critical or Major deviations
    const openDeviations = await query(
      `SELECT severity, COUNT(*) as cnt FROM batch_deviations
       WHERE batch_id = $1 AND severity IN ('CRITICAL', 'MAJOR')
       AND (status IS NULL OR status NOT IN ('RESOLVED', 'CLOSED'))
       GROUP BY severity`,
      [id]
    )
    if (openDeviations.rows.length > 0) {
      const devDetails = openDeviations.rows.map((r: any) => `${r.cnt} ${r.severity}`).join(', ')
      validationErrors.push({ check: 'deviations', message: `Unresolved deviations: ${devDetails}` })
    }

    // 6. Check at least 1 environmental reading exists
    const envResult = await query(
      `SELECT COUNT(*) as cnt FROM batch_environmental WHERE batch_id = $1`,
      [id]
    )
    if (parseInt(envResult.rows[0].cnt) === 0) {
      validationErrors.push({ check: 'environmental', message: 'At least 1 environmental monitoring reading must be recorded' })
    }

    // Return validation errors if any check fails
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { success: false, error: { code: 'RELEASE_VALIDATION_FAILED', message: 'Pre-release validation failed', validation_errors: validationErrors } },
        { status: 400 }
      )
    }

    // Create QA signature hash
    const signatureData = `${user.id}|${user.full_name}|${signature_meaning}|${new Date().toISOString()}`
    const signatureHash = crypto.createHash('sha256').update(signatureData).digest('hex')

    // Update batch status to RELEASED
    await query(
      `UPDATE batches SET status = 'RELEASED', qc_released_by = $1, qc_released_at = NOW(),
        qc_signature_hash = $2, updated_at = NOW() WHERE id = $3`,
      [user.id, signatureHash, id]
    )

    // Get QC tests for CoA
    const qcTests = await query(`SELECT * FROM batch_qc_tests WHERE batch_id = $1 ORDER BY test_name`, [id])

    const qaSig = {
      signer_full_name: user.full_name,
      signed_at: new Date().toISOString(),
      signature_meaning,
      signature_hash: signatureHash,
    }

    // Generate CoA PDF
    const { pdfBytes, sha256, qrPayload } = await generateCoAPDF(
      batch,
      { id: batch.mfr_id, company_name: batch.company_name, drap_licence_no: batch.drap_licence_no },
      qcTests.rows,
      qaSig
    )

    // Save PDF file
    const coaDir = path.join(process.cwd(), 'public', 'coa')
    await mkdir(coaDir, { recursive: true })
    const pdfPath = `/coa/CoA_${batch.batch_no}_${Date.now()}.pdf`
    await writeFile(path.join(process.cwd(), 'public', pdfPath), pdfBytes)

    // Create CoA record
    const coaRefNo = `COA-${batch.batch_no}-${Date.now().toString(36).toUpperCase()}`
    await query(
      `INSERT INTO coas (batch_id, coa_ref_no, generated_by, pdf_path, qr_code_payload, sha256_hash, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'ISSUED')`,
      [id, coaRefNo, user.id, pdfPath, qrPayload, sha256]
    )

    // Trigger CQS recalculation
    calculateCQS(batch.manufacturer_id).catch((err) =>
      console.error('CQS recalculation error:', err)
    )

    // Notify relevant users
    const sellerAdmins = await query(
      `SELECT id FROM users WHERE manufacturer_id = $1 AND role IN ('SELLER_ADMIN', 'SELLER_QA')`,
      [batch.manufacturer_id]
    )
    for (const admin of sellerAdmins.rows) {
      if (admin.id !== user.id) {
        await createNotification(admin.id, 'BATCH_RELEASED', {
          title: `Batch ${batch.batch_no} released`,
          body: `CoA generated (${coaRefNo}). Batch is now available for orders.`,
          link: `/seller/batches/${id}`,
          relatedEntityType: 'batch',
          relatedEntityId: id,
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        batch_id: id,
        status: 'RELEASED',
        coa_ref_no: coaRefNo,
        coa_pdf_path: pdfPath,
        sha256_hash: sha256,
        signature: {
          signed_by: user.full_name,
          signed_at: qaSig.signed_at,
          meaning: signature_meaning,
          hash: signatureHash,
        },
      },
    })
  } catch (error) {
    console.error('Batch release error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
