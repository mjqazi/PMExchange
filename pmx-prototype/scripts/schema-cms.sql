-- PMX CMS Schema
-- Run: sudo -u postgres psql -d pmx_prototype -f scripts/schema-cms.sql

-- Enable uuid extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Drop existing CMS tables (clean re-creation) ──────────────────────────

DROP TABLE IF EXISTS cms_featured_products CASCADE;
DROP TABLE IF EXISTS cms_product_views CASCADE;
DROP TABLE IF EXISTS cms_search_log CASCADE;
DROP TABLE IF EXISTS cms_product_categories CASCADE;
DROP TABLE IF EXISTS cms_email_templates CASCADE;
DROP TABLE IF EXISTS cms_settings CASCADE;
DROP TABLE IF EXISTS cms_media CASCADE;
DROP TABLE IF EXISTS cms_banners CASCADE;
DROP TABLE IF EXISTS cms_articles CASCADE;
DROP TABLE IF EXISTS cms_pages CASCADE;

-- ─── CMS: Content Pages ────────────────────────────────────────────────────

CREATE TABLE cms_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  meta_title VARCHAR(255),
  meta_description TEXT,
  og_image VARCHAR(500),
  status VARCHAR(20) DEFAULT 'DRAFT',
  author_id UUID REFERENCES users(id),
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── CMS: Blog/News Articles ───────────────────────────────────────────────

CREATE TABLE cms_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL DEFAULT '',
  cover_image VARCHAR(500),
  category VARCHAR(100),
  tags TEXT[],
  author_id UUID REFERENCES users(id),
  author_name VARCHAR(255),
  status VARCHAR(20) DEFAULT 'DRAFT',
  featured BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── CMS: Banners ──────────────────────────────────────────────────────────

CREATE TABLE cms_banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  placement VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  subtitle TEXT,
  cta_text VARCHAR(100),
  cta_link VARCHAR(500),
  bg_image VARCHAR(500),
  bg_color VARCHAR(50),
  text_color VARCHAR(50) DEFAULT '#FFFFFF',
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  starts_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── CMS: Media Library ────────────────────────────────────────────────────

CREATE TABLE cms_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size INTEGER NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  alt_text VARCHAR(255),
  folder VARCHAR(100) DEFAULT 'general',
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── CMS: Site Settings ────────────────────────────────────────────────────

CREATE TABLE cms_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'string',
  label VARCHAR(255),
  group_name VARCHAR(50) DEFAULT 'general',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── CMS: Email/Notification Templates ─────────────────────────────────────

CREATE TABLE cms_email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body_html TEXT NOT NULL DEFAULT '',
  body_text TEXT,
  variables TEXT[],
  active BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── CMS: Product Categories ───────────────────────────────────────────────

CREATE TABLE cms_product_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  image VARCHAR(500),
  parent_id UUID REFERENCES cms_product_categories(id),
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  product_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── CMS: Search Analytics ─────────────────────────────────────────────────

CREATE TABLE cms_search_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  query VARCHAR(255) NOT NULL,
  results_count INTEGER DEFAULT 0,
  user_id UUID REFERENCES users(id),
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── CMS: Product View Analytics ───────────────────────────────────────────

CREATE TABLE cms_product_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id),
  manufacturer_id UUID REFERENCES manufacturers(id),
  user_id UUID REFERENCES users(id),
  ip_address INET,
  referrer VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── CMS: Featured Products ───────────────────────────────────────────────

CREATE TABLE cms_featured_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  starts_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── Indexes ───────────────────────────────────────────────────────────────

CREATE INDEX idx_cms_pages_slug ON cms_pages(slug);
CREATE INDEX idx_cms_articles_slug ON cms_articles(slug);
CREATE INDEX idx_cms_articles_status ON cms_articles(status, published_at DESC);
CREATE INDEX idx_cms_banners_placement ON cms_banners(placement, active, sort_order);
CREATE INDEX idx_cms_media_folder ON cms_media(folder, created_at DESC);
CREATE INDEX idx_cms_search_log_query ON cms_search_log(query, created_at DESC);
CREATE INDEX idx_cms_product_views_product ON cms_product_views(product_id, created_at DESC);

-- ─── Seed: Default Pages ───────────────────────────────────────────────────

INSERT INTO cms_pages (slug, title, content, status, published_at) VALUES
('about', 'About PMX Pharma Exchange', 'PMX is Pakistan''s first compliance-linked B2B pharmaceutical export platform...', 'PUBLISHED', NOW()),
('terms', 'Terms of Service', 'These Terms of Service govern your use of the PMX platform...', 'PUBLISHED', NOW()),
('privacy', 'Privacy Policy', 'PMX is committed to protecting your privacy...', 'PUBLISHED', NOW()),
('how-it-works', 'How It Works', 'PMX connects DRAP-certified pharmaceutical manufacturers with global buyers...', 'PUBLISHED', NOW()),
('compliance', 'Quality & Compliance Standards', 'All manufacturers on PMX must meet strict compliance standards...', 'PUBLISHED', NOW());

-- ─── Seed: Default Settings ────────────────────────────────────────────────

INSERT INTO cms_settings (key, value, type, label, group_name) VALUES
('site_name', 'PMX Pharma Exchange', 'string', 'Site Name', 'general'),
('site_description', 'Pakistan''s B2B Pharmaceutical Export Compliance Platform', 'string', 'Site Description', 'general'),
('contact_email', 'info@pmx.com.pk', 'string', 'Contact Email', 'general'),
('commission_rate', '2.5', 'number', 'Commission Rate (%)', 'commerce'),
('escrow_auto_release_days', '3', 'number', 'Escrow Auto-Release Days', 'commerce'),
('min_cqs_marketplace', '40', 'number', 'Min CQS for Marketplace Visibility', 'commerce'),
('enable_blog', 'true', 'boolean', 'Enable Blog', 'features'),
('enable_academy', 'true', 'boolean', 'Enable PMX Academy', 'features'),
('maintenance_mode', 'false', 'boolean', 'Maintenance Mode', 'system');

-- ─── Seed: Email Templates ─────────────────────────────────────────────────

INSERT INTO cms_email_templates (slug, name, subject, body_html, variables) VALUES
('welcome', 'Welcome Email', 'Welcome to PMX Pharma Exchange', '<h1>Welcome, {{name}}!</h1><p>Your account has been created.</p>', ARRAY['name', 'email', 'role']),
('order_confirmation', 'Order Confirmation', 'Order {{order_ref}} Confirmed', '<h1>Order Confirmed</h1><p>Your order {{order_ref}} has been confirmed.</p>', ARRAY['order_ref', 'buyer_name', 'seller_name', 'amount']),
('kyb_approved', 'KYB Approved', 'Your KYB Verification is Complete', '<h1>Congratulations!</h1><p>Your company {{company}} has been verified.</p>', ARRAY['company', 'gate', 'next_steps']),
('escrow_funded', 'Escrow Funded', 'Escrow Funded for Order {{order_ref}}', '<h1>Escrow Funded</h1><p>USD {{amount}} has been deposited.</p>', ARRAY['order_ref', 'amount', 'buyer_name']);

-- ─── Seed: Sample Blog Articles ────────────────────────────────────────────

INSERT INTO cms_articles (slug, title, excerpt, content, category, tags, author_name, status, featured, published_at) VALUES
('pakistan-pharma-exports-2026', 'Pakistan Pharma Exports Set to Reach $1B by 2028', 'Industry analysts predict significant growth in Pakistani pharmaceutical exports...', 'Pakistan''s pharmaceutical industry is on track to reach $1 billion in annual exports by 2028, driven by increasing demand from Middle Eastern, African, and Central Asian markets...', 'Industry News', ARRAY['exports', 'growth', 'pakistan'], 'PMX Research', 'PUBLISHED', TRUE, NOW() - INTERVAL '3 days'),
('who-gmp-guide', 'Complete Guide to WHO-GMP Certification for Pakistani Manufacturers', 'Everything you need to know about obtaining WHO-GMP certification...', 'WHO-GMP certification is a crucial step for Pakistani pharmaceutical manufacturers looking to export to regulated markets...', 'Compliance', ARRAY['WHO-GMP', 'certification', 'guide'], 'PMX Compliance Team', 'PUBLISHED', TRUE, NOW() - INTERVAL '7 days'),
('drap-export-process', 'Simplified DRAP Export Documentation Process', 'How PMX streamlines the DRAP export documentation process...', 'Exporting pharmaceuticals from Pakistan requires several DRAP documents including COPP, GMP certificates, and Free Sale certificates...', 'Platform Updates', ARRAY['DRAP', 'exports', 'documentation'], 'PMX Team', 'PUBLISHED', FALSE, NOW() - INTERVAL '14 days');

-- ─── Seed: Banners ─────────────────────────────────────────────────────────

INSERT INTO cms_banners (placement, title, subtitle, cta_text, cta_link, bg_color, active) VALUES
('hero', 'Pakistan''s Pharmaceutical Export Marketplace', 'Connecting DRAP-certified manufacturers with global buyers through compliance-verified trade', 'Browse Products', '/marketplace/search', '#0F172A', TRUE),
('announcement_bar', 'New: WHO-GMP Pathway Assessment Tool Now Available', NULL, 'Learn More', '/marketplace', '#1D9E75', TRUE);

-- ─── Seed: Product Categories ──────────────────────────────────────────────

INSERT INTO cms_product_categories (slug, name, description, icon, sort_order) VALUES
('cardiovascular', 'Cardiovascular', 'Heart and blood vessel medications', '🫀', 1),
('anti-diabetics', 'Anti-Diabetics', 'Diabetes management medications', '💉', 2),
('anti-infectives', 'Anti-Infectives', 'Antibiotics and antimicrobials', '🦠', 3),
('analgesics', 'Analgesics & NSAIDs', 'Pain relief medications', '💊', 4),
('gastrointestinal', 'Gastrointestinal', 'Digestive system medications', '🧬', 5),
('respiratory', 'Respiratory', 'Lung and airway medications', '🌬', 6);
