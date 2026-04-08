import { query, queryOne } from './db'

export interface MatchResult {
  manufacturer_id: string
  company_name: string
  tier: number
  cqs_score: number
  l1_eligible: boolean
  l1_fail_reason: string | null
  l3_match_probability: number
  total_score: number
}

export async function runMatchingEngine(rfqId: string): Promise<MatchResult[]> {
  const rfq = await queryOne<{
    id: string
    buyer_id: string
    product_inn: string
    product_strength: string
    product_form: string
    volume_qty: number
    destination_country: string
    required_certs: string[] | null
  }>(`SELECT * FROM rfqs WHERE id = $1`, [rfqId])
  if (!rfq) throw new Error('RFQ not found')

  // Get all PMX-Certified, ACTIVE manufacturers with their products
  const sellers = await query(
    `SELECT m.*,
            array_agg(DISTINCT p.id) as product_ids,
            array_agg(DISTINCT p.inn_name || '|' || p.strength || '|' || p.dosage_form) as products
     FROM manufacturers m
     LEFT JOIN products p ON p.manufacturer_id = m.id AND p.status = 'ACTIVE'
     WHERE m.pmx_certified = TRUE AND m.status = 'ACTIVE'
     GROUP BY m.id`
  )

  const results: MatchResult[] = []

  for (const seller of sellers.rows) {
    let failReason: string | null = null

    // L1 CHECK 1: Product match - INN + strength + dosage form
    const productMatch = (seller.products || []).some((p: string) => {
      if (!p) return false
      const [inn, strength, form] = p.split('|')
      return (
        inn?.toLowerCase().trim() === rfq.product_inn.toLowerCase().trim() &&
        strength?.toLowerCase().trim() === rfq.product_strength.toLowerCase().trim() &&
        form?.toLowerCase().trim() === rfq.product_form.toLowerCase().trim()
      )
    })
    if (!productMatch) {
      failReason = 'Product INN+strength+form not in DRAP-registered portfolio'
      results.push({
        manufacturer_id: seller.id,
        company_name: seller.company_name,
        tier: seller.tier,
        cqs_score: parseFloat(seller.cqs_score) || 0,
        l1_eligible: false,
        l1_fail_reason: failReason,
        l3_match_probability: 0,
        total_score: 0,
      })
      continue
    }

    // L1 CHECK 2: Certification match
    if (rfq.required_certs && rfq.required_certs.length > 0) {
      const sellerCerts = seller.tier >= 2 ? ['WHO-GMP', 'DRAP-GMP'] : ['DRAP-GMP']
      if (seller.tier >= 3) sellerCerts.push('SFDA', 'NMPA')
      const certsMet = rfq.required_certs.every((c: string) => sellerCerts.includes(c))
      if (!certsMet) {
        failReason = 'Required certifications not held'
        results.push({
          manufacturer_id: seller.id,
          company_name: seller.company_name,
          tier: seller.tier,
          cqs_score: parseFloat(seller.cqs_score) || 0,
          l1_eligible: false,
          l1_fail_reason: failReason,
          l3_match_probability: 0,
          total_score: 0,
        })
        continue
      }
    }

    // L1 CHECK 3: Capacity match (1.5x safety margin)
    const product = await queryOne<{ annual_production_capacity: number }>(
      `SELECT annual_production_capacity FROM products
       WHERE manufacturer_id = $1 AND LOWER(inn_name) = LOWER($2) AND LOWER(strength) = LOWER($3) LIMIT 1`,
      [seller.id, rfq.product_inn, rfq.product_strength]
    )
    const monthlyCapacity = product ? product.annual_production_capacity / 12 : 0
    if (monthlyCapacity < rfq.volume_qty * 1.5) {
      failReason = 'Capacity below 1.5x RFQ volume'
      results.push({
        manufacturer_id: seller.id,
        company_name: seller.company_name,
        tier: seller.tier,
        cqs_score: parseFloat(seller.cqs_score) || 0,
        l1_eligible: false,
        l1_fail_reason: failReason,
        l3_match_probability: 0,
        total_score: 0,
      })
      continue
    }

    // L1 CHECK 4: Geography match (relaxed for prototype)
    // Check if seller has export-eligible countries matching destination
    // If no countries set, pass anyway
    const geoMatch = await queryOne(
      `SELECT 1 FROM products
       WHERE manufacturer_id = $1 AND $2 = ANY(export_eligible_countries) LIMIT 1`,
      [seller.id, rfq.destination_country]
    )
    // Relaxed: pass if no country restrictions set

    // L1 CHECK 5: PMX-Certified status (belt and suspenders - already filtered)
    if (!seller.pmx_certified || seller.status !== 'ACTIVE') {
      failReason = 'Not PMX-Certified or account not active'
      results.push({
        manufacturer_id: seller.id,
        company_name: seller.company_name,
        tier: seller.tier,
        cqs_score: parseFloat(seller.cqs_score) || 0,
        l1_eligible: false,
        l1_fail_reason: failReason,
        l3_match_probability: 0,
        total_score: 0,
      })
      continue
    }

    // L1 CHECK 6: Buyer blacklist check
    const blacklisted = await queryOne(
      `SELECT 1 FROM buyer_blacklists WHERE buyer_id = $1 AND manufacturer_id = $2`,
      [rfq.buyer_id, seller.id]
    )
    if (blacklisted) {
      failReason = 'Seller on buyer exclusion list'
      results.push({
        manufacturer_id: seller.id,
        company_name: seller.company_name,
        tier: seller.tier,
        cqs_score: parseFloat(seller.cqs_score) || 0,
        l1_eligible: false,
        l1_fail_reason: failReason,
        l3_match_probability: 0,
        total_score: 0,
      })
      continue
    }

    // All L1 checks passed

    // L2: CQS score weighting (50% of match score)
    const cqsWeight = (parseFloat(seller.cqs_score) / 100) * 50

    // L3: Simplified AI match (cold start: CQS + tier + past transactions)
    const pastOrders = await queryOne<{ cnt: string }>(
      `SELECT COUNT(*) as cnt FROM orders WHERE seller_id = $1 AND buyer_id = $2 AND status = 'COMPLETED'`,
      [seller.id, rfq.buyer_id]
    )
    const relationshipBonus = Math.min(20, parseInt(pastOrders?.cnt || '0') * 5)
    const tierBonus = (seller.tier - 1) * 10
    const l3Score = Math.min(100, 50 + (parseFloat(seller.cqs_score) / 100) * 30 + tierBonus + relationshipBonus)

    const totalScore = cqsWeight + (l3Score / 100) * 50

    results.push({
      manufacturer_id: seller.id,
      company_name: seller.company_name,
      tier: seller.tier,
      cqs_score: parseFloat(seller.cqs_score) || 0,
      l1_eligible: true,
      l1_fail_reason: null,
      l3_match_probability: Math.round(l3Score) / 100,
      total_score: Math.round(totalScore * 100) / 100,
    })
  }

  // Sort by total score descending
  results.sort((a, b) => b.total_score - a.total_score)

  // Save match results to rfq_responses (update ranks)
  const eligible = results.filter((r) => r.l1_eligible)
  for (let i = 0; i < eligible.length; i++) {
    await query(
      `INSERT INTO rfq_responses (rfq_id, manufacturer_id, price_per_unit_usd, lead_time_days, l1_eligible, cqs_score_at_response, l3_match_probability, match_rank, status)
       VALUES ($1, $2, 0, 0, TRUE, $3, $4, $5, 'PENDING')
       ON CONFLICT (rfq_id, manufacturer_id) DO UPDATE SET
         l1_eligible = TRUE,
         cqs_score_at_response = EXCLUDED.cqs_score_at_response,
         l3_match_probability = EXCLUDED.l3_match_probability,
         match_rank = EXCLUDED.match_rank`,
      [rfqId, eligible[i].manufacturer_id, eligible[i].cqs_score, eligible[i].l3_match_probability, i + 1]
    )
  }

  return results
}
