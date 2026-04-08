// ─── Enums ───────────────────────────────────────────────────────────────────

export type UserRole =
  | 'SELLER_ADMIN'
  | 'SELLER_QA'
  | 'SELLER_RA'
  | 'SELLER_OPERATOR'
  | 'SELLER_VIEW'
  | 'BUYER_ADMIN'
  | 'PMX_ADMIN'

export type UserStatus = 'ACTIVE' | 'LOCKED' | 'SUSPENDED'

export type KYBGate = 'GATE_1' | 'GATE_2' | 'GATE_3' | 'GATE_4' | 'APPROVED' | 'REJECTED'

export type ManufacturerStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING'

export type BatchStatus = 'IN_PROGRESS' | 'QA_REVIEW' | 'RELEASED' | 'QUARANTINE' | 'REJECTED'

export type CoAStatus = 'DRAFT' | 'ISSUED' | 'SUPERSEDED'

export type RFQStatus = 'DRAFT' | 'PUBLISHED' | 'AWARDED' | 'CLOSED'

export type OrderStatus =
  | 'RFQ_POSTED'
  | 'RESPONSES_RECEIVED'
  | 'NEGOTIATING'
  | 'CONTRACT_GENERATED'
  | 'ESCROW_FUNDED'
  | 'IN_PRODUCTION'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'COMPLETED'

export type EscrowStatus = 'PENDING' | 'FUNDED' | 'RELEASED' | 'DISPUTED' | 'REFUNDED'

export type DisputeStatus = 'OPEN' | 'RESOLVED' | 'CLOSED'

export type BuyerType = 'INSTITUTIONAL' | 'COMMERCIAL' | 'FENGTAI'

export type PathwayType = 'WHO_GMP' | 'SFDA' | 'USFDA_PREANDA' | 'NMPA_TCM'

export type PathwayStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'

export type NotificationType =
  | 'KYB_GATE_APPROVED'
  | 'KYB_GATE_REJECTED'
  | 'RFQ_MATCH_FOUND'
  | 'RFQ_RESPONSE_RECEIVED'
  | 'NEGOTIATION_MESSAGE'
  | 'CONTRACT_GENERATED'
  | 'CONTRACT_SIGNED'
  | 'ESCROW_FUNDED'
  | 'BATCH_LINKED'
  | 'BATCH_RELEASED'
  | 'ORDER_DISPATCHED'
  | 'ORDER_DELIVERED'
  | 'ORDER_COMPLETED'
  | 'DISPUTE_RAISED'
  | 'DISPUTE_RESOLVED'
  | 'CQS_WARNING'
  | 'ACCOUNT_SUSPENDED'
  | 'RATING_REQUESTED'
  | 'DEVIATION_FILED'

export type DeviationSeverity = 'CRITICAL' | 'MAJOR' | 'MINOR'

export type DocStatus = 'UPLOADED' | 'VERIFIED' | 'REJECTED' | 'EXPIRED'

export type MessageType = 'MESSAGE' | 'OFFER' | 'COUNTER_OFFER' | 'ACCEPT' | 'DOCUMENT' | 'SYSTEM'

// ─── Entities ────────────────────────────────────────────────────────────────

export interface User {
  id: string
  manufacturer_id: string | null
  buyer_id: string | null
  email: string
  password_hash: string
  full_name: string
  role: UserRole
  mfa_enabled: boolean
  mfa_secret: string | null
  last_login_at: string | null
  failed_login_count: number
  locked_until: string | null
  status: UserStatus
  created_at: string
}

export interface Manufacturer {
  id: string
  company_name: string
  drap_licence_no: string
  secp_no: string | null
  ntn: string | null
  strn: string | null
  tier: number
  pmx_certified: boolean
  cqs_score: number
  cqs_updated_at: string | null
  kyb_gate: KYBGate
  status: ManufacturerStatus
  bank_account_confirmed: boolean
  bank_name: string | null
  bank_account_masked: string | null
  qc_lab_verified: boolean
  last_gmp_inspection_date: string | null
  next_gmp_inspection_due: string | null
  product_count: number
  gate3_session_date: string | null
  gate3_session_notes: string | null
  gate3_compliance_officer: string | null
  gate2_verification_notes: string | null
  tos_accepted_at: string | null
  address: string | null
  city: string | null
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  manufacturer_id: string
  inn_name: string
  brand_name: string | null
  strength: string
  dosage_form: string
  drap_reg_no: string | null
  product_category: string | null
  export_eligible_countries: string[] | null
  marketed_status: boolean
  labelling_reference: string | null
  pharmacopoeia: string | null
  annual_production_capacity: number | null
  status: string
  registered_at: string | null
  created_at: string
}

export interface Buyer {
  id: string
  company_name: string
  country_code: string
  regulatory_authority: string | null
  buyer_type: BuyerType
  verification_status: string
  credit_limit_usd: number
  transactions_completed: number
  kyb_notes: string | null
  kyb_verified_by: string | null
  kyb_verified_at: string | null
  tos_accepted_at: string | null
  created_at: string
}

export interface Batch {
  id: string
  manufacturer_id: string
  product_id: string
  order_id: string | null
  batch_no: string
  manufacture_date: string
  expiry_date: string
  shelf_life_months: number | null
  batch_size: number
  yield_actual: number | null
  yield_theoretical: number | null
  yield_variance_pct: number | null
  status: BatchStatus
  qc_released_by: string | null
  qc_released_at: string | null
  qc_signature_hash: string | null
  created_at: string
  updated_at: string
  // Joined fields (optional, populated on detail queries)
  product_inn?: string
  brand_name?: string
  strength?: string
  dosage_form?: string
}

export interface BatchMaterial {
  id: string
  batch_id: string
  material_type: 'API' | 'EXCIPIENT'
  material_name: string
  supplier_name: string | null
  lot_no: string | null
  quantity_used: number
  unit: string
  supplier_coa_ref: string | null
  created_at: string
}

export interface BatchStep {
  id: string
  batch_id: string
  step_no: number
  description: string
  operator_id: string | null
  equipment_id: string | null
  process_params: Record<string, unknown> | null
  completed_at: string | null
  status: string
  signed_by: string | null
  signed_at: string | null
  signer_full_name: string | null
  signature_meaning: string | null
  signature_hash: string | null
  countersigned_by: string | null
  countersigned_at: string | null
  created_at: string
}

export interface BatchQCTest {
  id: string
  batch_id: string
  test_name: string
  method_reference: string | null
  specification: string
  result_value: string
  result_unit: string | null
  pass_fail: 'PASS' | 'FAIL'
  analyst_id: string | null
  tested_at: string | null
  notes: string | null
  created_at: string
}

export interface BatchEnvironmental {
  id: string
  batch_id: string
  step_id: string | null
  production_area: string
  recorded_at: string
  temperature_c: number | null
  humidity_pct: number | null
  differential_pressure_pa: number | null
  within_spec: boolean
  notes: string | null
  recorded_by: string | null
  created_at: string
}

export interface BatchDeviation {
  id: string
  batch_id: string
  description: string
  severity: DeviationSeverity
  capa_ref: string | null
  reported_by: string | null
  reported_at: string
  closed_at: string | null
  resolution: string | null
  created_at: string
}

export interface CoA {
  id: string
  batch_id: string
  coa_ref_no: string
  generated_at: string
  generated_by: string | null
  pdf_path: string | null
  qr_code_payload: string | null
  sha256_hash: string | null
  status: CoAStatus
  created_at: string
}

export interface DRAPDocument {
  id: string
  manufacturer_id: string
  doc_type: 'COPP' | 'GMP_CERT' | 'FREE_SALE' | 'TDAP'
  product_id: string | null
  destination_country: string | null
  doc_ref: string | null
  pdf_path: string | null
  sha256_hash: string | null
  generated_at: string
  generated_by: string | null
  valid_until: string | null
  created_at: string
}

export interface RFQ {
  id: string
  buyer_id: string
  rfq_type: string
  product_inn: string
  product_strength: string
  product_form: string
  volume_qty: number
  volume_unit: string
  order_frequency: string | null
  required_certs: string[] | null
  destination_country: string
  incoterms: string | null
  lead_time_days: number | null
  price_min_usd: number | null
  price_max_usd: number | null
  payment_terms: string
  status: RFQStatus
  expires_at: string | null
  created_at: string
  updated_at: string
}

export interface RFQResponse {
  id: string
  rfq_id: string
  manufacturer_id: string
  product_id: string | null
  price_per_unit_usd: number
  lead_time_days: number
  min_order_qty: number | null
  notes: string | null
  l1_eligible: boolean
  l1_fail_reason: string | null
  cqs_score_at_response: number | null
  l3_match_probability: number | null
  match_rank: number | null
  status: string
  submitted_at: string
  created_at: string
}

export interface Order {
  id: string
  rfq_id: string | null
  buyer_id: string
  seller_id: string
  product_id: string | null
  batch_id: string | null
  quantity: number
  agreed_price_usd: number | null
  pmx_commission_usd: number | null
  status: OrderStatus
  contract_pdf_path: string | null
  contract_ref: string | null
  contract_hash: string | null
  contract_signed_buyer_at: string | null
  contract_signed_seller_at: string | null
  escrow_account_ref: string | null
  escrow_status: EscrowStatus
  escrow_funded_at: string | null
  tracking_ref: string | null
  dispatched_at: string | null
  delivered_at: string | null
  completed_at: string | null
  ratings_deadline_at: string | null
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  order_id: string | null
  rfq_id: string | null
  sender_id: string
  sender_role: UserRole
  message_type: MessageType
  content: string
  offer_price_usd: number | null
  offer_qty: number | null
  offer_lead_days: number | null
  offer_incoterms: string | null
  offer_version: number
  is_current_offer: boolean
  doc_path: string | null
  doc_name: string | null
  doc_sha256: string | null
  read_by_recipient: boolean
  read_at: string | null
  created_at: string
}

export interface EscrowAccount {
  id: string
  order_id: string
  pso_account_ref: string | null
  amount_usd: number
  funded_at: string | null
  released_at: string | null
  release_trigger: 'BUYER_CONFIRM' | 'AUTO_3DAY' | 'ADMIN_DECISION' | null
  status: EscrowStatus
  created_at: string
}

export interface Dispute {
  id: string
  order_id: string
  raised_by_user: string
  raised_by_role: 'BUYER' | 'SELLER' | null
  description: string
  evidence_notes: string | null
  status: DisputeStatus
  resolution_notes: string | null
  resolved_by: string | null
  resolved_at: string | null
  created_at: string
}

export interface Rating {
  id: string
  order_id: string
  rated_by_user: string
  rating_type: 'CPR' | 'CPR-C'
  // CPR criteria (commercial)
  crit_on_time_delivery: number | null
  crit_quantity_accuracy: number | null
  crit_communication: number | null
  crit_doc_speed: number | null
  crit_overall_commercial: number | null
  // CPR-C criteria (compliance)
  crit_coa_quality: number | null
  crit_batch_record: number | null
  crit_deviation_handling: number | null
  crit_regulatory_docs: number | null
  crit_overall_compliance: number | null
  overall_score: number | null
  comments: string | null
  submitted_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string
  link: string | null
  read: boolean
  read_at: string | null
  related_entity_type: string | null
  related_entity_id: string | null
  created_at: string
}

export interface OnboardingDocument {
  id: string
  manufacturer_id: string
  gate: KYBGate
  doc_type: string
  doc_label: string | null
  file_path: string | null
  file_name: string | null
  verification_status: DocStatus
  verified_by: string | null
  verified_at: string | null
  rejection_reason: string | null
  expiry_date: string | null
  uploaded_by: string | null
  uploaded_at: string
}

export interface SupplierQualification {
  id: string
  manufacturer_id: string
  supplier_name: string
  supplier_country: string | null
  material_type: 'API' | 'Excipient' | null
  qualification_status: string
  last_audit_date: string | null
  next_audit_due: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface RegulatoryPathwayProgress {
  id: string
  manufacturer_id: string
  pathway: PathwayType
  status: PathwayStatus
  steps_total: number
  steps_completed: number
  started_at: string | null
  submitted_at: string | null
  completed_at: string | null
  assigned_to: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface RegulatoryPathwayStep {
  id: string
  pathway_progress_id: string
  step_no: number
  step_name: string
  step_description: string | null
  auto_populated: boolean
  source_table: string | null
  source_field: string | null
  auto_populated_value: string | null
  manual_value: string | null
  completed: boolean
  completed_by: string | null
  completed_at: string | null
  created_at: string
}

export interface AcademyModule {
  id: string
  slug: string
  title: string
  description: string | null
  duration_hours: number | null
  target_roles: UserRole[] | null
  sort_order: number
  active: boolean
}

export interface AcademySection {
  id: string
  module_id: string
  section_no: number
  title: string
  content_md: string | null
  sort_order: number
}

export interface AcademyProgress {
  id: string
  user_id: string
  module_id: string
  sections_done: number
  sections_total: number
  completed: boolean
  completed_at: string | null
  started_at: string
}

export interface ActiveSession {
  id: string
  user_id: string
  refresh_token_hash: string
  ip_address: string | null
  user_agent: string | null
  created_at: string
  last_used_at: string
  expires_at: string
}

export interface AuditLogEntry {
  id: string
  table_name: string
  record_id: string | null
  field_name: string | null
  old_value: string | null
  new_value: string | null
  changed_by_user_id: string | null
  changed_at: string
  ip_address: string | null
  action: 'INSERT' | 'UPDATE' | 'DELETE'
}

// ─── Matching Engine Types ──────────────────────────────────────────────────

export interface MatchResult {
  manufacturer_id: string
  company_name: string
  tier: number
  cqs_score: number
  l1_eligible: boolean
  l1_fail_reason?: string
  l3_match_probability: number
  total_score: number
}

// ─── API Response Envelope ──────────────────────────────────────────────────

export interface APISuccess<T = unknown> {
  success: true
  data: T
}

export interface APIError {
  success: false
  error: {
    code: string
    message: string
  }
}

export type APIResponse<T = unknown> = APISuccess<T> | APIError

// ─── Paginated Response ─────────────────────────────────────────────────────

export interface PaginatedResponse<T = unknown> {
  data: T[]
  next_cursor: string | null
  has_more: boolean
}

// ─── Order Lifecycle Valid Transitions ───────────────────────────────────────

export const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  RFQ_POSTED: ['RESPONSES_RECEIVED'],
  RESPONSES_RECEIVED: ['NEGOTIATING'],
  NEGOTIATING: ['CONTRACT_GENERATED'],
  CONTRACT_GENERATED: ['ESCROW_FUNDED'],
  ESCROW_FUNDED: ['IN_PRODUCTION'],
  IN_PRODUCTION: ['DISPATCHED'],
  DISPATCHED: ['DELIVERED'],
  DELIVERED: ['COMPLETED'],
  COMPLETED: [],
}

// ─── Onboarding Gate 1 Document Definitions ─────────────────────────────────

export const GATE_1_DOCS = [
  { type: 'DRAP_LICENCE', label: 'DRAP Manufacturing Licence', required: true },
  { type: 'SECP_CERT', label: 'SECP Company Registration', required: true },
  { type: 'NTN_CERT', label: 'FBR NTN Certificate', required: true },
  { type: 'BANK_LETTER', label: 'Bank Account Confirmation Letter', required: true },
  { type: 'PRODUCT_LIST', label: 'DRAP-registered Product List', required: true },
  { type: 'WHO_GMP_CERT', label: 'WHO-GMP Certificate', required: false },
  { type: 'QC_LAB_CERT', label: 'QC Lab Qualification Evidence', required: false },
] as const

// ─── KYB Gate 2 Checks ─────────────────────────────────────────────────────

export const KYB_CHECKS = [
  { check: 'DRAP_LICENCE_ACTIVE', api: 'DRAP API', mock: true },
  { check: 'SECP_REGISTRATION', api: 'SECP API', mock: true },
  { check: 'FBR_NTN_VALID', api: 'FBR API', mock: true },
  { check: 'FATF_AML_CLEAR', api: 'AML API', mock: true },
] as const

// ─── WHO-GMP Pathway Steps ──────────────────────────────────────────────────

export const WHO_GMP_STEPS = [
  { step_no: 1, name: 'Site master file', auto: true, source_table: 'manufacturers', source_field: 'address' },
  { step_no: 2, name: 'Organisation and personnel', auto: true, source_table: 'users', source_field: 'role' },
  { step_no: 3, name: 'Premises and equipment', auto: false },
  { step_no: 4, name: 'Documentation system', auto: true, source_table: 'batches', source_field: 'batch_no' },
  { step_no: 5, name: 'Production controls', auto: true, source_table: 'batch_steps', source_field: 'process_params' },
  { step_no: 6, name: 'Quality control (QC lab)', auto: true, source_table: 'batch_qc_tests', source_field: 'test_name' },
  { step_no: 7, name: 'Supplier qualification', auto: true, source_table: 'supplier_qualifications', source_field: 'qualification_status' },
  { step_no: 8, name: 'Complaints and recalls', auto: false },
  { step_no: 9, name: 'Self-inspection system', auto: false },
  { step_no: 10, name: 'Contract manufacturing', auto: false },
  { step_no: 11, name: 'GMP certificates held', auto: true, source_table: 'manufacturers', source_field: 'last_gmp_inspection_date' },
] as const
