-- PMX Prototype - Seed Data
-- Run after schema.sql: sudo -u postgres psql -d pmx_prototype -f scripts/seed.sql

-- Academy modules
INSERT INTO academy_modules (slug, title, description, duration_hours, sort_order) VALUES
  ('gmp-orientation',  'GMP Orientation',           'Foundational GMP principles', 4.0, 1),
  ('drap-export-docs', 'DRAP Export Documentation', 'COPP, GMP, Free Sale certificates', 2.5, 2),
  ('who-gmp-readiness','WHO-GMP Readiness Basics',  'Preparing for WHO-GMP pre-assessment', 3.0, 3);

-- Academy sections (5 for gmp-orientation module)
INSERT INTO academy_sections (module_id, section_no, title, content_md, sort_order)
SELECT m.id, s.no, s.title, s.content, s.no FROM academy_modules m
CROSS JOIN (VALUES
  (1,'GMP principles and regulatory framework','Introduction to Good Manufacturing Practice, ICH Q10, DRAP requirements.'),
  (2,'Documentation and record-keeping','Paper vs electronic records. 21 CFR Part 11 overview. Audit trails.'),
  (3,'Contamination prevention','Clean room classifications, gowning, hygiene protocols.'),
  (4,'Deviation and CAPA management','Types of deviations, classification, corrective action timelines.'),
  (5,'Audit readiness','Self-inspection checklist, mock audit preparation.')
) AS s(no, title, content) WHERE m.slug = 'gmp-orientation';

-- Demo manufacturers
INSERT INTO manufacturers (id, company_name, drap_licence_no, secp_no, ntn, tier, pmx_certified, cqs_score, cqs_updated_at, kyb_gate, status, bank_account_confirmed, product_count, city)
VALUES
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Lahore Generics Ltd.', 'MFG-0124-2019', 'LGN-001', '1234567-8', 2, TRUE,  83.4, NOW(), 'APPROVED', 'ACTIVE', TRUE,  0, 'Lahore'),
  ('a1b2c3d4-0000-0000-0000-000000000002', 'Karachi PharmaCorp',   'MFG-0218-2018', 'KPC-002', '2345678-9', 2, TRUE,  71.8, NOW(), 'APPROVED', 'ACTIVE', TRUE,  0, 'Karachi'),
  ('a1b2c3d4-0000-0000-0000-000000000003', 'Multan MedGen Pvt. Ltd.','MFG-0341-2020','MMG-003','3456789-0', 2, TRUE,  66.2, NOW(), 'APPROVED', 'ACTIVE', TRUE,  0, 'Multan'),
  ('a1b2c3d4-0000-0000-0000-000000000004', 'Faisalabad Meds Co.',  'MFG-0217-2021', 'FMC-004', '4212098-3', 1, FALSE, 0,    NULL,  'GATE_2',  'PENDING', FALSE, 0, 'Faisalabad'),
  ('a1b2c3d4-0000-0000-0000-000000000005', 'Karachi Pharma Ltd.',  'MFG-0119-2017', 'KPL-005', '5678901-2', 1, FALSE, 38.2, NOW(), 'APPROVED', 'ACTIVE', TRUE,  0, 'Karachi');

-- Demo buyers
INSERT INTO buyers (id, company_name, country_code, buyer_type, verification_status, credit_limit_usd, transactions_completed)
VALUES
  ('b1b2c3d4-0000-0000-0000-000000000001', 'Gulf Medical LLC',       'SA', 'INSTITUTIONAL', 'VERIFIED', 2000000, 7),
  ('b1b2c3d4-0000-0000-0000-000000000002', 'Al-Zahrawi Pharma',     'AE', 'COMMERCIAL',    'VERIFIED',  500000, 3),
  ('b1b2c3d4-0000-0000-0000-000000000003', 'Fengtai Imports Co.',   'CN', 'FENGTAI',       'VERIFIED', 5000000, 2);

-- Demo users (password for all: PMX@prototype2026)
-- bcrypt hash generated via scripts/hash-password.ts
-- Note: spec uses u1/u2/u9 prefixes but UUIDs require hex chars, so using c1/c2/c9
INSERT INTO users (id, manufacturer_id, buyer_id, email, password_hash, full_name, role, status)
VALUES
  ('c1000000-0000-0000-0000-000000000001','a1b2c3d4-0000-0000-0000-000000000001', NULL,                                  'admin@lahoregenerics.pk','$2b$12$nLZrUW2Q6P9J7BBoXHBTdejjacX7nVZFeZjULa1LpzQLgAV3LfTWm','Ali Hassan',      'SELLER_ADMIN',    'ACTIVE'),
  ('c1000000-0000-0000-0000-000000000002','a1b2c3d4-0000-0000-0000-000000000001', NULL,                                  'qa@lahoregenerics.pk',   '$2b$12$nLZrUW2Q6P9J7BBoXHBTdejjacX7nVZFeZjULa1LpzQLgAV3LfTWm','Dr. Farrukh Ali',  'SELLER_QA',       'ACTIVE'),
  ('c1000000-0000-0000-0000-000000000003','a1b2c3d4-0000-0000-0000-000000000001', NULL,                                  'ops@lahoregenerics.pk',  '$2b$12$nLZrUW2Q6P9J7BBoXHBTdejjacX7nVZFeZjULa1LpzQLgAV3LfTWm','Tariq Mahmood',    'SELLER_OPERATOR', 'ACTIVE'),
  ('c2000000-0000-0000-0000-000000000001', NULL,                                 'b1b2c3d4-0000-0000-0000-000000000001', 'buyer@gulfmedical.sa',   '$2b$12$nLZrUW2Q6P9J7BBoXHBTdejjacX7nVZFeZjULa1LpzQLgAV3LfTWm','Khalid Al-Rashid', 'BUYER_ADMIN',     'ACTIVE'),
  ('c9000000-0000-0000-0000-000000000001', NULL,                                  NULL,                                  'admin@pmx.com.pk',       '$2b$12$nLZrUW2Q6P9J7BBoXHBTdejjacX7nVZFeZjULa1LpzQLgAV3LfTWm','Nasir R.H.',       'PMX_ADMIN',       'ACTIVE');

-- Demo products for Lahore Generics (product_count will be auto-updated by trigger)
INSERT INTO products (manufacturer_id, inn_name, brand_name, strength, dosage_form, drap_reg_no, marketed_status, annual_production_capacity)
VALUES
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Metformin Hydrochloride', 'MetPure',    '500mg', 'Tablet',  'PKR-DRG-18-3421', TRUE, 24000000),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Atorvastatin',            'AtorGlen',   '40mg',  'Tablet',  'PKR-DRG-19-2211', TRUE, 18000000),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Ciprofloxacin',           'CiproCure',  '500mg', 'Tablet',  'PKR-DRG-17-1844', TRUE, 36000000),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Amoxicillin',             'AmoxiPlus',  '250mg', 'Capsule', 'PKR-DRG-16-0991', TRUE, 60000000);
