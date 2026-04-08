-- PMX Prototype - Complete Database Schema
-- Run: sudo -u postgres psql -d pmx_prototype -f scripts/schema.sql

-- Drop existing objects for clean re-creation
DO $$
DECLARE t TEXT;
BEGIN
  -- Drop triggers first
  FOR t IN SELECT unnest(ARRAY[
    'manufacturers','products','batches','batch_materials','batch_steps',
    'batch_qc_tests','batch_environmental','batch_deviations','coas',
    'drap_documents','rfqs','rfq_responses','orders','messages',
    'escrow_accounts','disputes','ratings','users','onboarding_documents'
  ]) LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS audit_%s ON %s', t, t);
  END LOOP;
END $$;

DROP TRIGGER IF EXISTS trg_product_count ON products;

-- Drop rules
DROP RULE IF EXISTS no_update_audit ON audit_log;
DROP RULE IF EXISTS no_delete_audit ON audit_log;

-- Drop functions
DROP FUNCTION IF EXISTS audit_trigger_fn() CASCADE;
DROP FUNCTION IF EXISTS update_product_count() CASCADE;

-- Drop tables in dependency order
DROP TABLE IF EXISTS academy_progress CASCADE;
DROP TABLE IF EXISTS academy_sections CASCADE;
DROP TABLE IF EXISTS academy_modules CASCADE;
DROP TABLE IF EXISTS regulatory_pathway_steps CASCADE;
DROP TABLE IF EXISTS regulatory_pathway_progress CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS ratings CASCADE;
DROP TABLE IF EXISTS disputes CASCADE;
DROP TABLE IF EXISTS escrow_accounts CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS rfq_responses CASCADE;
DROP TABLE IF EXISTS buyer_blacklists CASCADE;
DROP TABLE IF EXISTS rfqs CASCADE;
DROP TABLE IF EXISTS drap_documents CASCADE;
DROP TABLE IF EXISTS coas CASCADE;
DROP TABLE IF EXISTS batch_deviations CASCADE;
DROP TABLE IF EXISTS batch_environmental CASCADE;
DROP TABLE IF EXISTS batch_qc_tests CASCADE;
DROP TABLE IF EXISTS batch_steps CASCADE;
DROP TABLE IF EXISTS batch_materials CASCADE;
DROP TABLE IF EXISTS batches CASCADE;
DROP TABLE IF EXISTS onboarding_documents CASCADE;
DROP TABLE IF EXISTS supplier_qualifications CASCADE;
DROP TABLE IF EXISTS active_sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS buyers CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS manufacturers CASCADE;

-- Drop enums
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS user_status CASCADE;
DROP TYPE IF EXISTS kyb_gate CASCADE;
DROP TYPE IF EXISTS manufacturer_status CASCADE;
DROP TYPE IF EXISTS batch_status CASCADE;
DROP TYPE IF EXISTS coa_status CASCADE;
DROP TYPE IF EXISTS rfq_status CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS escrow_status CASCADE;
DROP TYPE IF EXISTS dispute_status CASCADE;
DROP TYPE IF EXISTS buyer_type CASCADE;
DROP TYPE IF EXISTS pathway_type CASCADE;
DROP TYPE IF EXISTS pathway_status CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS deviation_severity CASCADE;
DROP TYPE IF EXISTS doc_status CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUMS
CREATE TYPE user_role AS ENUM ('SELLER_ADMIN','SELLER_QA','SELLER_RA','SELLER_OPERATOR','SELLER_VIEW','BUYER_ADMIN','PMX_ADMIN');
CREATE TYPE user_status AS ENUM ('ACTIVE','LOCKED','SUSPENDED');
CREATE TYPE kyb_gate AS ENUM ('GATE_1','GATE_2','GATE_3','GATE_4','APPROVED','REJECTED');
CREATE TYPE manufacturer_status AS ENUM ('ACTIVE','SUSPENDED','PENDING');
CREATE TYPE batch_status AS ENUM ('IN_PROGRESS','QA_REVIEW','RELEASED','QUARANTINE','REJECTED');
CREATE TYPE coa_status AS ENUM ('DRAFT','ISSUED','SUPERSEDED');
CREATE TYPE rfq_status AS ENUM ('DRAFT','PUBLISHED','AWARDED','CLOSED');
CREATE TYPE order_status AS ENUM ('RFQ_POSTED','RESPONSES_RECEIVED','NEGOTIATING','CONTRACT_GENERATED','ESCROW_FUNDED','IN_PRODUCTION','DISPATCHED','DELIVERED','COMPLETED');
CREATE TYPE escrow_status AS ENUM ('PENDING','FUNDED','RELEASED','DISPUTED','REFUNDED');
CREATE TYPE dispute_status AS ENUM ('OPEN','RESOLVED','CLOSED');
CREATE TYPE buyer_type AS ENUM ('INSTITUTIONAL','COMMERCIAL','FENGTAI');
CREATE TYPE pathway_type AS ENUM ('WHO_GMP','SFDA','USFDA_PREANDA','NMPA_TCM');
CREATE TYPE pathway_status AS ENUM ('NOT_STARTED','IN_PROGRESS','SUBMITTED','APPROVED','REJECTED');
CREATE TYPE notification_type AS ENUM (
  'KYB_GATE_APPROVED','KYB_GATE_REJECTED','RFQ_MATCH_FOUND','RFQ_RESPONSE_RECEIVED',
  'NEGOTIATION_MESSAGE','CONTRACT_GENERATED','CONTRACT_SIGNED','ESCROW_FUNDED',
  'BATCH_LINKED','BATCH_RELEASED','ORDER_DISPATCHED','ORDER_DELIVERED','ORDER_COMPLETED',
  'DISPUTE_RAISED','DISPUTE_RESOLVED','CQS_WARNING','ACCOUNT_SUSPENDED','RATING_REQUESTED','DEVIATION_FILED'
);
CREATE TYPE deviation_severity AS ENUM ('CRITICAL','MAJOR','MINOR');
CREATE TYPE doc_status AS ENUM ('UPLOADED','VERIFIED','REJECTED','EXPIRED');

-- MANUFACTURERS
CREATE TABLE manufacturers (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name          VARCHAR(255) NOT NULL,
  drap_licence_no       VARCHAR(100) UNIQUE NOT NULL,
  secp_no               VARCHAR(100),
  ntn                   VARCHAR(50),
  strn                  VARCHAR(50),
  tier                  SMALLINT DEFAULT 1 CHECK (tier IN (1,2,3)),
  pmx_certified         BOOLEAN DEFAULT FALSE,
  cqs_score             DECIMAL(5,2) DEFAULT 0,
  cqs_updated_at        TIMESTAMP WITH TIME ZONE,
  kyb_gate              kyb_gate DEFAULT 'GATE_1',
  status                manufacturer_status DEFAULT 'PENDING',
  -- Tier qualification fields
  bank_account_confirmed BOOLEAN DEFAULT FALSE,
  bank_name             VARCHAR(255),
  bank_account_masked   VARCHAR(20),
  qc_lab_verified       BOOLEAN DEFAULT FALSE,
  last_gmp_inspection_date DATE,
  next_gmp_inspection_due  DATE,
  product_count         INTEGER DEFAULT 0,
  -- Gate 3 session
  gate3_session_date    DATE,
  gate3_session_notes   TEXT,
  gate3_compliance_officer UUID,
  gate2_verification_notes TEXT,
  -- Terms of service
  tos_accepted_at       TIMESTAMP WITH TIME ZONE,
  -- Address
  address               TEXT,
  city                  VARCHAR(100),
  -- Timestamps
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PRODUCTS
CREATE TABLE products (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  manufacturer_id       UUID NOT NULL REFERENCES manufacturers(id) ON DELETE CASCADE,
  inn_name              VARCHAR(255) NOT NULL,
  brand_name            VARCHAR(255),
  strength              VARCHAR(100) NOT NULL,
  dosage_form           VARCHAR(100) NOT NULL,
  drap_reg_no           VARCHAR(100),
  product_category      VARCHAR(100),
  export_eligible_countries TEXT[], -- array of country codes
  marketed_status       BOOLEAN DEFAULT TRUE,
  labelling_reference   VARCHAR(255),
  pharmacopoeia         VARCHAR(100),
  annual_production_capacity BIGINT, -- in dosage units
  status                VARCHAR(50) DEFAULT 'ACTIVE',
  registered_at         DATE,
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- USERS
CREATE TABLE users (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  manufacturer_id       UUID REFERENCES manufacturers(id),
  buyer_id              UUID, -- FK added after buyers table
  email                 VARCHAR(255) UNIQUE NOT NULL,
  password_hash         VARCHAR(255) NOT NULL,
  full_name             VARCHAR(255) NOT NULL,
  role                  user_role NOT NULL,
  mfa_enabled           BOOLEAN DEFAULT FALSE,
  mfa_secret            VARCHAR(255),
  last_login_at         TIMESTAMP WITH TIME ZONE,
  failed_login_count    INTEGER DEFAULT 0,
  locked_until          TIMESTAMP WITH TIME ZONE,
  status                user_status DEFAULT 'ACTIVE',
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ACTIVE SESSIONS (3-session limit enforcement)
CREATE TABLE active_sessions (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash    VARCHAR(255) NOT NULL,
  ip_address            INET,
  user_agent            TEXT,
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at            TIMESTAMP WITH TIME ZONE NOT NULL
);

-- BUYERS
CREATE TABLE buyers (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name          VARCHAR(255) NOT NULL,
  country_code          VARCHAR(10) NOT NULL,
  regulatory_authority  VARCHAR(255),
  buyer_type            buyer_type DEFAULT 'COMMERCIAL',
  verification_status   VARCHAR(50) DEFAULT 'PENDING',
  credit_limit_usd      BIGINT DEFAULT 0,
  transactions_completed INTEGER DEFAULT 0,
  kyb_notes             TEXT,
  kyb_verified_by       UUID REFERENCES users(id),
  kyb_verified_at       TIMESTAMP WITH TIME ZONE,
  tos_accepted_at       TIMESTAMP WITH TIME ZONE,
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE users ADD CONSTRAINT fk_user_buyer FOREIGN KEY (buyer_id) REFERENCES buyers(id);

-- ONBOARDING DOCUMENTS (KYB gate uploads)
CREATE TABLE onboarding_documents (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  manufacturer_id       UUID NOT NULL REFERENCES manufacturers(id) ON DELETE CASCADE,
  gate                  kyb_gate NOT NULL,
  doc_type              VARCHAR(100) NOT NULL,
  -- doc_type values: DRAP_LICENCE, SECP_CERT, NTN_CERT, BANK_LETTER, PRODUCT_LIST, WHO_GMP_CERT, QC_LAB_CERT
  doc_label             VARCHAR(255),
  file_path             VARCHAR(500),
  file_name             VARCHAR(255),
  verification_status   doc_status DEFAULT 'UPLOADED',
  verified_by           UUID REFERENCES users(id),
  verified_at           TIMESTAMP WITH TIME ZONE,
  rejection_reason      TEXT,
  expiry_date           DATE,
  uploaded_by           UUID REFERENCES users(id),
  uploaded_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(manufacturer_id, gate, doc_type)
);

-- SUPPLIER QUALIFICATIONS
CREATE TABLE supplier_qualifications (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  manufacturer_id       UUID NOT NULL REFERENCES manufacturers(id) ON DELETE CASCADE,
  supplier_name         VARCHAR(255) NOT NULL,
  supplier_country      VARCHAR(100),
  material_type         VARCHAR(100), -- 'API' or 'Excipient'
  qualification_status  VARCHAR(50) DEFAULT 'QUALIFIED',
  last_audit_date       DATE,
  next_audit_due        DATE,
  notes                 TEXT,
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- BATCHES (eBMR master record)
CREATE TABLE batches (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  manufacturer_id       UUID NOT NULL REFERENCES manufacturers(id) ON DELETE CASCADE,
  product_id            UUID NOT NULL REFERENCES products(id),
  order_id              UUID, -- FK added after orders table
  batch_no              VARCHAR(100) UNIQUE NOT NULL,
  manufacture_date      DATE NOT NULL,
  expiry_date           DATE NOT NULL,
  shelf_life_months     INTEGER,
  batch_size            BIGINT NOT NULL,
  yield_actual          BIGINT,
  yield_theoretical     BIGINT,
  yield_variance_pct    DECIMAL(6,3),
  status                batch_status DEFAULT 'IN_PROGRESS',
  qc_released_by        UUID REFERENCES users(id),
  qc_released_at        TIMESTAMP WITH TIME ZONE,
  qc_signature_hash     VARCHAR(128),
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- BATCH MATERIALS (Bill of Materials)
CREATE TABLE batch_materials (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id              UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  material_type         VARCHAR(50) NOT NULL, -- 'API' or 'EXCIPIENT'
  material_name         VARCHAR(255) NOT NULL,
  supplier_name         VARCHAR(255),
  lot_no                VARCHAR(100),
  quantity_used         DECIMAL(14,4) NOT NULL,
  unit                  VARCHAR(50) NOT NULL,
  supplier_coa_ref      VARCHAR(255),
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- BATCH STEPS (Manufacturing steps)
CREATE TABLE batch_steps (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id              UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  step_no               INTEGER NOT NULL,
  description           TEXT NOT NULL,
  operator_id           UUID REFERENCES users(id),
  equipment_id          VARCHAR(100),
  process_params        JSONB,
  completed_at          TIMESTAMP WITH TIME ZONE,
  status                VARCHAR(50) DEFAULT 'PENDING',
  -- 21 CFR Part 11 e-signature fields
  signed_by             UUID REFERENCES users(id),
  signed_at             TIMESTAMP WITH TIME ZONE,
  signer_full_name      VARCHAR(255),
  signature_meaning     VARCHAR(500),
  signature_hash        VARCHAR(128),
  countersigned_by      UUID REFERENCES users(id),
  countersigned_at      TIMESTAMP WITH TIME ZONE,
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- BATCH QC TESTS (In-process and final QC)
CREATE TABLE batch_qc_tests (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id              UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  test_name             VARCHAR(255) NOT NULL,
  method_reference      VARCHAR(255),
  specification         VARCHAR(255),
  result_value          VARCHAR(255),
  result_unit           VARCHAR(50),
  pass_fail             VARCHAR(10), -- 'PASS' or 'FAIL'
  analyst_id            UUID REFERENCES users(id),
  tested_at             TIMESTAMP WITH TIME ZONE,
  notes                 TEXT,
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- BATCH ENVIRONMENTAL (Temperature/humidity/pressure monitoring)
CREATE TABLE batch_environmental (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id              UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  step_id               UUID REFERENCES batch_steps(id),
  production_area       VARCHAR(255) NOT NULL,
  recorded_at           TIMESTAMP WITH TIME ZONE NOT NULL,
  temperature_c         DECIMAL(6,2),
  humidity_pct          DECIMAL(5,2),
  differential_pressure_pa DECIMAL(8,2),
  within_spec           BOOLEAN DEFAULT TRUE,
  notes                 TEXT,
  recorded_by           UUID REFERENCES users(id),
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- BATCH DEVIATIONS
CREATE TABLE batch_deviations (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id              UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  description           TEXT NOT NULL,
  severity              deviation_severity NOT NULL,
  capa_ref              VARCHAR(100),
  reported_by           UUID REFERENCES users(id),
  reported_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at             TIMESTAMP WITH TIME ZONE,
  resolution            TEXT,
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CERTIFICATES OF ANALYSIS
CREATE TABLE coas (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id              UUID NOT NULL REFERENCES batches(id),
  coa_ref_no            VARCHAR(100) UNIQUE NOT NULL,
  generated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  generated_by          UUID REFERENCES users(id),
  pdf_path              VARCHAR(500),
  qr_code_payload       TEXT,
  sha256_hash           VARCHAR(128),
  status                coa_status DEFAULT 'ISSUED',
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DRAP DOCUMENTS
CREATE TABLE drap_documents (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  manufacturer_id       UUID NOT NULL REFERENCES manufacturers(id),
  doc_type              VARCHAR(100) NOT NULL, -- 'COPP','GMP_CERT','FREE_SALE','TDAP'
  product_id            UUID REFERENCES products(id),
  destination_country   VARCHAR(100),
  doc_ref               VARCHAR(100) UNIQUE,
  pdf_path              VARCHAR(500),
  sha256_hash           VARCHAR(128),
  generated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  generated_by          UUID REFERENCES users(id),
  valid_until           DATE,
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RFQS
CREATE TABLE rfqs (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id              UUID NOT NULL REFERENCES buyers(id),
  rfq_type              VARCHAR(10) DEFAULT 'RFQ',
  product_inn           VARCHAR(255) NOT NULL,
  product_strength      VARCHAR(100) NOT NULL,
  product_form          VARCHAR(100) NOT NULL,
  volume_qty            BIGINT NOT NULL,
  volume_unit           VARCHAR(50) DEFAULT 'tablets',
  order_frequency       VARCHAR(100),
  required_certs        TEXT[],
  destination_country   VARCHAR(100) NOT NULL,
  incoterms             VARCHAR(50),
  lead_time_days        INTEGER,
  price_min_usd         DECIMAL(12,6),
  price_max_usd         DECIMAL(12,6),
  payment_terms         VARCHAR(255) DEFAULT 'PSO Escrow',
  status                rfq_status DEFAULT 'DRAFT',
  expires_at            TIMESTAMP WITH TIME ZONE,
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RFQ RESPONSES (Seller quotations)
CREATE TABLE rfq_responses (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rfq_id                UUID NOT NULL REFERENCES rfqs(id),
  manufacturer_id       UUID NOT NULL REFERENCES manufacturers(id),
  product_id            UUID REFERENCES products(id),
  price_per_unit_usd    DECIMAL(12,6) NOT NULL,
  lead_time_days        INTEGER NOT NULL,
  min_order_qty         BIGINT,
  notes                 TEXT,
  -- Matching engine scores (computed at response time)
  l1_eligible           BOOLEAN DEFAULT FALSE,
  l1_fail_reason        TEXT,
  cqs_score_at_response DECIMAL(5,2),
  l3_match_probability  DECIMAL(5,4),
  match_rank            INTEGER,
  status                VARCHAR(50) DEFAULT 'PENDING', -- PENDING, SHORTLISTED, NOT_SELECTED, AWARDED
  submitted_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(rfq_id, manufacturer_id)
);

-- BUYER BLACKLISTS (seller exclusion by buyer)
CREATE TABLE buyer_blacklists (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id              UUID NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
  manufacturer_id       UUID NOT NULL REFERENCES manufacturers(id) ON DELETE CASCADE,
  reason                TEXT,
  added_by              UUID REFERENCES users(id),
  added_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(buyer_id, manufacturer_id)
);

-- ORDERS
CREATE TABLE orders (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rfq_id                UUID REFERENCES rfqs(id),
  buyer_id              UUID NOT NULL REFERENCES buyers(id),
  seller_id             UUID NOT NULL REFERENCES manufacturers(id),
  product_id            UUID REFERENCES products(id),
  batch_id              UUID REFERENCES batches(id),
  quantity              BIGINT NOT NULL,
  agreed_price_usd      DECIMAL(12,6),
  pmx_commission_usd    DECIMAL(12,2),
  status                order_status DEFAULT 'NEGOTIATING',
  -- Contract fields
  contract_pdf_path     VARCHAR(500),
  contract_ref          VARCHAR(100) UNIQUE,
  contract_hash         VARCHAR(128),
  contract_signed_buyer_at  TIMESTAMP WITH TIME ZONE,
  contract_signed_seller_at TIMESTAMP WITH TIME ZONE,
  -- Escrow fields
  escrow_account_ref    VARCHAR(255),
  escrow_status         escrow_status DEFAULT 'PENDING',
  escrow_funded_at      TIMESTAMP WITH TIME ZONE,
  -- Delivery
  tracking_ref          VARCHAR(255),
  dispatched_at         TIMESTAMP WITH TIME ZONE,
  delivered_at          TIMESTAMP WITH TIME ZONE,
  completed_at          TIMESTAMP WITH TIME ZONE,
  ratings_deadline_at   TIMESTAMP WITH TIME ZONE,
  -- Timestamps
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE batches ADD CONSTRAINT fk_batch_order FOREIGN KEY (order_id) REFERENCES orders(id);

-- MESSAGES (Negotiation + order communication thread)
CREATE TABLE messages (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id              UUID REFERENCES orders(id),
  rfq_id                UUID REFERENCES rfqs(id),
  sender_id             UUID NOT NULL REFERENCES users(id),
  sender_role           user_role NOT NULL,
  message_type          VARCHAR(50) NOT NULL DEFAULT 'MESSAGE',
  -- message_type: MESSAGE | OFFER | COUNTER_OFFER | ACCEPT | DOCUMENT | SYSTEM
  content               TEXT NOT NULL,
  -- Offer fields (null for non-offer types)
  offer_price_usd       DECIMAL(12,6),
  offer_qty             BIGINT,
  offer_lead_days       INTEGER,
  offer_incoterms       VARCHAR(50),
  offer_version         INTEGER DEFAULT 1,
  is_current_offer      BOOLEAN DEFAULT FALSE,
  -- Document attachment
  doc_path              VARCHAR(500),
  doc_name              VARCHAR(255),
  doc_sha256            VARCHAR(128),
  -- Read status
  read_by_recipient     BOOLEAN DEFAULT FALSE,
  read_at               TIMESTAMP WITH TIME ZONE,
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ESCROW ACCOUNTS
CREATE TABLE escrow_accounts (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id              UUID NOT NULL REFERENCES orders(id),
  pso_account_ref       VARCHAR(255) UNIQUE,
  amount_usd            DECIMAL(14,2) NOT NULL,
  funded_at             TIMESTAMP WITH TIME ZONE,
  released_at           TIMESTAMP WITH TIME ZONE,
  release_trigger       VARCHAR(100), -- 'BUYER_CONFIRM' | 'AUTO_3DAY' | 'ADMIN_DECISION'
  status                escrow_status DEFAULT 'PENDING',
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DISPUTES
CREATE TABLE disputes (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id              UUID NOT NULL REFERENCES orders(id),
  raised_by_user        UUID NOT NULL REFERENCES users(id),
  raised_by_role        VARCHAR(50), -- 'BUYER' or 'SELLER'
  description           TEXT NOT NULL,
  evidence_notes        TEXT,
  status                dispute_status DEFAULT 'OPEN',
  resolution_notes      TEXT,
  resolved_by           UUID REFERENCES users(id),
  resolved_at           TIMESTAMP WITH TIME ZONE,
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RATINGS (CPR and CPR-C)
CREATE TABLE ratings (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id              UUID NOT NULL REFERENCES orders(id),
  rated_by_user         UUID NOT NULL REFERENCES users(id),
  rating_type           VARCHAR(10) NOT NULL, -- 'CPR' or 'CPR-C'
  -- CPR criteria (commercial)
  crit_on_time_delivery SMALLINT CHECK (crit_on_time_delivery BETWEEN 1 AND 5),
  crit_quantity_accuracy SMALLINT CHECK (crit_quantity_accuracy BETWEEN 1 AND 5),
  crit_communication    SMALLINT CHECK (crit_communication BETWEEN 1 AND 5),
  crit_doc_speed        SMALLINT CHECK (crit_doc_speed BETWEEN 1 AND 5),
  crit_overall_commercial SMALLINT CHECK (crit_overall_commercial BETWEEN 1 AND 5),
  -- CPR-C criteria (compliance)
  crit_coa_quality      SMALLINT CHECK (crit_coa_quality BETWEEN 1 AND 5),
  crit_batch_record     SMALLINT CHECK (crit_batch_record BETWEEN 1 AND 5),
  crit_deviation_handling SMALLINT CHECK (crit_deviation_handling BETWEEN 1 AND 5),
  crit_regulatory_docs  SMALLINT CHECK (crit_regulatory_docs BETWEEN 1 AND 5),
  crit_overall_compliance SMALLINT CHECK (crit_overall_compliance BETWEEN 1 AND 5),
  overall_score         DECIMAL(3,2),
  comments              TEXT,
  submitted_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- REGULATORY PATHWAY PROGRESS
CREATE TABLE regulatory_pathway_progress (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  manufacturer_id       UUID NOT NULL REFERENCES manufacturers(id) ON DELETE CASCADE,
  pathway               pathway_type NOT NULL,
  status                pathway_status DEFAULT 'NOT_STARTED',
  steps_total           INTEGER DEFAULT 0,
  steps_completed       INTEGER DEFAULT 0,
  started_at            TIMESTAMP WITH TIME ZONE,
  submitted_at          TIMESTAMP WITH TIME ZONE,
  completed_at          TIMESTAMP WITH TIME ZONE,
  assigned_to           UUID REFERENCES users(id),
  notes                 TEXT,
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(manufacturer_id, pathway)
);

CREATE TABLE regulatory_pathway_steps (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pathway_progress_id   UUID NOT NULL REFERENCES regulatory_pathway_progress(id) ON DELETE CASCADE,
  step_no               INTEGER NOT NULL,
  step_name             VARCHAR(255) NOT NULL,
  step_description      TEXT,
  auto_populated        BOOLEAN DEFAULT FALSE,
  source_table          VARCHAR(100),
  source_field          VARCHAR(100),
  auto_populated_value  TEXT,
  manual_value          TEXT,
  completed             BOOLEAN DEFAULT FALSE,
  completed_by          UUID REFERENCES users(id),
  completed_at          TIMESTAMP WITH TIME ZONE,
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PMX ACADEMY
CREATE TABLE academy_modules (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug                  VARCHAR(100) UNIQUE NOT NULL,
  title                 VARCHAR(255) NOT NULL,
  description           TEXT,
  duration_hours        DECIMAL(4,1),
  target_roles          user_role[],
  sort_order            INTEGER DEFAULT 0,
  active                BOOLEAN DEFAULT TRUE
);

CREATE TABLE academy_sections (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id             UUID NOT NULL REFERENCES academy_modules(id),
  section_no            INTEGER NOT NULL,
  title                 VARCHAR(255) NOT NULL,
  content_md            TEXT,
  sort_order            INTEGER DEFAULT 0
);

CREATE TABLE academy_progress (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES users(id),
  module_id             UUID NOT NULL REFERENCES academy_modules(id),
  sections_done         INTEGER DEFAULT 0,
  sections_total        INTEGER DEFAULT 0,
  completed             BOOLEAN DEFAULT FALSE,
  completed_at          TIMESTAMP WITH TIME ZONE,
  started_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, module_id)
);

-- NOTIFICATIONS
CREATE TABLE notifications (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type                  notification_type NOT NULL,
  title                 VARCHAR(255) NOT NULL,
  body                  TEXT NOT NULL,
  link                  VARCHAR(500),
  read                  BOOLEAN DEFAULT FALSE,
  read_at               TIMESTAMP WITH TIME ZONE,
  related_entity_type   VARCHAR(50),
  related_entity_id     UUID,
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AUDIT LOG (immutable -- trigger on every table)
CREATE TABLE audit_log (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name            VARCHAR(100) NOT NULL,
  record_id             UUID,
  field_name            VARCHAR(100),
  old_value             TEXT,
  new_value             TEXT,
  changed_by_user_id    UUID,
  changed_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address            INET,
  action                VARCHAR(20) NOT NULL -- INSERT | UPDATE | DELETE
);

-- INDEXES
CREATE INDEX idx_batches_mfr ON batches(manufacturer_id);
CREATE INDEX idx_batches_product ON batches(product_id);
CREATE INDEX idx_products_mfr ON products(manufacturer_id);
CREATE INDEX idx_rfqs_buyer ON rfqs(buyer_id);
CREATE INDEX idx_rfqs_status ON rfqs(status);
CREATE INDEX idx_orders_buyer ON orders(buyer_id);
CREATE INDEX idx_orders_seller ON orders(seller_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_messages_order ON messages(order_id, created_at);
CREATE INDEX idx_notifications_user ON notifications(user_id, read, created_at DESC);
CREATE INDEX idx_sessions_user ON active_sessions(user_id);
CREATE INDEX idx_onboarddoc_mfr ON onboarding_documents(manufacturer_id, gate);
CREATE INDEX idx_audit_table ON audit_log(table_name, changed_at DESC);
CREATE INDEX idx_rfq_responses_rfq ON rfq_responses(rfq_id, manufacturer_id);
CREATE INDEX idx_escrow_order ON escrow_accounts(order_id);
CREATE INDEX idx_disputes_order ON disputes(order_id, status);
CREATE INDEX idx_ratings_order ON ratings(order_id);
CREATE INDEX idx_batches_status ON batches(status);
CREATE INDEX idx_coas_batch ON coas(batch_id);
CREATE INDEX idx_users_mfr ON users(manufacturer_id);
CREATE INDEX idx_users_buyer ON users(buyer_id);

-- AUDIT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION audit_trigger_fn()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log(table_name, record_id, action, old_value, changed_at)
    VALUES(TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD)::TEXT, NOW());
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log(table_name, record_id, action, old_value, new_value, changed_at)
    VALUES(TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(OLD)::TEXT, row_to_json(NEW)::TEXT, NOW());
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log(table_name, record_id, action, new_value, changed_at)
    VALUES(TG_TABLE_NAME, NEW.id, 'INSERT', row_to_json(NEW)::TEXT, NOW());
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Apply audit trigger to all critical tables
DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'manufacturers','products','batches','batch_materials','batch_steps',
    'batch_qc_tests','batch_environmental','batch_deviations','coas',
    'drap_documents','rfqs','rfq_responses','orders','messages',
    'escrow_accounts','disputes','ratings','users','onboarding_documents'
  ]) LOOP
    EXECUTE format('CREATE TRIGGER audit_%s AFTER INSERT OR UPDATE OR DELETE ON %s FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn()', t, t);
  END LOOP;
END $$;

-- PREVENT UPDATE/DELETE ON AUDIT_LOG (all roles)
CREATE RULE no_update_audit AS ON UPDATE TO audit_log DO INSTEAD NOTHING;
CREATE RULE no_delete_audit AS ON DELETE TO audit_log DO INSTEAD NOTHING;

-- PRODUCT COUNT TRIGGER
CREATE OR REPLACE FUNCTION update_product_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE manufacturers SET product_count = product_count + 1 WHERE id = NEW.manufacturer_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE manufacturers SET product_count = product_count - 1 WHERE id = OLD.manufacturer_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_product_count AFTER INSERT OR DELETE ON products
  FOR EACH ROW EXECUTE FUNCTION update_product_count();
