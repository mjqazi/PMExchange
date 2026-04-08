import { query, queryOne } from './db'
import { createNotification } from './notifications'

// CQS = (BatchCompleteness x 0.25) + (CoAAccuracy x 0.20) + (DeviationRateInv x 0.20)
//       + (SupplierQualCurrency x 0.15) + (CertificationStatus x 0.12) + (DeliveryPerformance x 0.08)

export async function calculateCQS(manufacturerId: string): Promise<number> {
  const [batches, coas, deviations, suppliers, certs, orders] = await Promise.all([
    query(
      `SELECT COUNT(*) as total,
              COUNT(CASE WHEN status = 'RELEASED' THEN 1 END) as released,
              AVG(CASE WHEN yield_variance_pct IS NOT NULL THEN 100 - ABS(yield_variance_pct) END) as completeness_score
       FROM batches WHERE manufacturer_id = $1 AND created_at > NOW() - INTERVAL '90 days'`,
      [manufacturerId]
    ),
    query(
      `SELECT COUNT(*) as total FROM coas c
       JOIN batches b ON c.batch_id = b.id
       WHERE b.manufacturer_id = $1 AND c.status = 'ISSUED'`,
      [manufacturerId]
    ),
    query(
      `SELECT COUNT(*) as total,
              COUNT(CASE WHEN severity = 'CRITICAL' OR severity = 'MAJOR' THEN 1 END) as severe
       FROM batch_deviations bd JOIN batches b ON bd.batch_id = b.id
       WHERE b.manufacturer_id = $1 AND bd.created_at > NOW() - INTERVAL '90 days'`,
      [manufacturerId]
    ),
    query(
      `SELECT COUNT(*) as total,
              COUNT(CASE WHEN qualification_status = 'QUALIFIED' AND last_audit_date > NOW() - INTERVAL '1 year' THEN 1 END) as current
       FROM supplier_qualifications WHERE manufacturer_id = $1`,
      [manufacturerId]
    ),
    queryOne<{ tier: number; last_gmp_inspection_date: string | null }>(
      `SELECT tier, last_gmp_inspection_date FROM manufacturers WHERE id = $1`,
      [manufacturerId]
    ),
    query(
      `SELECT COUNT(*) as total,
              COUNT(CASE WHEN dispatched_at <= completed_at - INTERVAL '2 days' THEN 1 END) as on_time
       FROM orders WHERE seller_id = $1 AND status = 'COMPLETED'`,
      [manufacturerId]
    ),
  ])

  const b = batches.rows[0]
  const co = coas.rows[0]
  const d = deviations.rows[0]
  const s = suppliers.rows[0]
  const cert = certs
  const o = orders.rows[0]

  const batchCompleteness = Math.min(100, parseFloat(b.completeness_score) || 80)
  const totalBatches = parseInt(b.total) || 0
  const coaAccuracy = totalBatches > 0
    ? Math.min(100, (parseInt(co.total) / totalBatches) * 100)
    : 80 // Default for new manufacturers with no batches yet
  const totalDevs = parseInt(d.total) || 0
  const deviationRateInv = totalDevs === 0
    ? 100
    : Math.max(0, 100 - (parseInt(d.severe) / totalDevs) * 100)
  const totalSuppliers = parseInt(s.total) || 0
  const supplierQual = totalSuppliers > 0
    ? (parseInt(s.current) / totalSuppliers) * 100
    : 75 // Default for new manufacturers with no supplier records
  const tier = cert?.tier || 1
  const hasValidGMP = cert?.last_gmp_inspection_date &&
    new Date(cert.last_gmp_inspection_date) > new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000)
  const certStatus = tier === 3 ? 100 : tier === 2 && hasValidGMP ? 90 : tier === 1 ? 70 : 50
  const totalOrders = parseInt(o.total) || 0
  const deliveryPerf = totalOrders === 0 ? 75 : (parseInt(o.on_time) / totalOrders) * 100

  const cqs =
    batchCompleteness * 0.25 +
    coaAccuracy * 0.2 +
    deviationRateInv * 0.2 +
    supplierQual * 0.15 +
    certStatus * 0.12 +
    deliveryPerf * 0.08

  const rounded = Math.round(cqs * 10) / 10

  // Auto-suspend below 40
  if (cqs < 40) {
    await query(
      `UPDATE manufacturers SET status = 'SUSPENDED', cqs_score = $1, cqs_updated_at = NOW() WHERE id = $2`,
      [rounded, manufacturerId]
    )
    await createCQSAlert(manufacturerId, rounded)
  } else {
    await query(
      `UPDATE manufacturers SET cqs_score = $1, cqs_updated_at = NOW(),
        status = CASE WHEN status = 'SUSPENDED' THEN 'ACTIVE' ELSE status END
       WHERE id = $2`,
      [rounded, manufacturerId]
    )
  }

  return rounded
}

async function createCQSAlert(manufacturerId: string, cqs: number) {
  const mfr = await queryOne<{ company_name: string }>(
    `SELECT company_name FROM manufacturers WHERE id = $1`,
    [manufacturerId]
  )
  const admins = await query(`SELECT id FROM users WHERE role = 'PMX_ADMIN' AND status = 'ACTIVE'`)
  for (const admin of admins.rows) {
    await createNotification(admin.id, 'CQS_WARNING', {
      title: `CQS Auto-Suspend: ${mfr?.company_name}`,
      body: `CQS dropped to ${cqs} (below 40). Manufacturer auto-suspended.`,
      link: `/admin/sellers`,
      relatedEntityType: 'manufacturer',
      relatedEntityId: manufacturerId,
    })
  }
}
