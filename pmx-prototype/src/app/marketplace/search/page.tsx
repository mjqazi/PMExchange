'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { products, searchProducts } from '../data';
import { Suspense } from 'react';

function getProductGradient(form: string): string {
  switch (form) {
    case 'Capsule': return 'linear-gradient(135deg, #FAEEDA 0%, #E1F5EE 100%)';
    case 'Syrup': return 'linear-gradient(135deg, #E6F1FB 0%, #F1EFE8 100%)';
    default: return 'linear-gradient(135deg, #E1F5EE 0%, #E6F1FB 100%)';
  }
}

function getCqsColor(badge: string): string {
  if (badge === 'green') return '#1D9E75';
  if (badge === 'amber') return '#D4A843';
  return '#A32D2D';
}

function getCqsBg(badge: string): string {
  if (badge === 'green') return 'rgba(29,158,117,0.12)';
  if (badge === 'amber') return 'rgba(212,168,67,0.12)';
  return 'rgba(163,45,45,0.12)';
}

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialQuery = searchParams.get('q') || '';
  const initialForm = searchParams.get('form') || '';
  const initialCert = searchParams.get('cert') || '';
  const initialTier = searchParams.get('tier') || '';
  const initialCountry = searchParams.get('country') || '';
  const initialSort = searchParams.get('sort') || 'relevance';

  const [query, setQuery] = useState(initialQuery);
  const [dosageForm, setDosageForm] = useState(initialForm);
  const [certification, setCertification] = useState(initialCert);
  const [tierFilter, setTierFilter] = useState(initialTier);
  const [cqsMin, setCqsMin] = useState(0);
  const [countryFilter, setCountryFilter] = useState(initialCountry);
  const [sortBy, setSortBy] = useState(initialSort);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const results = useMemo(() => {
    let filtered: typeof products;

    if (query.trim()) {
      filtered = searchProducts(query, {
        dosageForm: dosageForm || undefined,
        certification: certification || undefined,
        tier: tierFilter || undefined,
        minCqs: cqsMin || undefined,
        country: countryFilter || undefined,
      });
    } else {
      filtered = [...products];
      if (dosageForm) filtered = filtered.filter(p => p.dosageFormShort.toLowerCase() === dosageForm.toLowerCase());
      if (certification) filtered = filtered.filter(p => p.certifications.some(c => c.toLowerCase() === certification.toLowerCase()));
      if (tierFilter) filtered = filtered.filter(p => p.tier === tierFilter);
      if (cqsMin) filtered = filtered.filter(p => p.cqs >= cqsMin);
      if (countryFilter) filtered = filtered.filter(p => p.exportCountries.some(c => c.toLowerCase().includes(countryFilter.toLowerCase())));
    }

    if (sortBy === 'cqs') filtered.sort((a, b) => b.cqs - a.cqs);
    else if (sortBy === 'price-low') filtered.sort((a, b) => a.priceLow - b.priceLow);
    else if (sortBy === 'price-high') filtered.sort((a, b) => b.priceHigh - a.priceHigh);

    return filtered;
  }, [query, dosageForm, certification, tierFilter, cqsMin, countryFilter, sortBy]);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (dosageForm) params.set('form', dosageForm);
    if (certification) params.set('cert', certification);
    if (tierFilter) params.set('tier', tierFilter);
    if (countryFilter) params.set('country', countryFilter);
    if (sortBy !== 'relevance') params.set('sort', sortBy);
    router.push(`/marketplace/search?${params.toString()}`);
  }, [query, dosageForm, certification, tierFilter, countryFilter, sortBy, router]);

  const clearFilters = () => {
    setDosageForm('');
    setCertification('');
    setTierFilter('');
    setCqsMin(0);
    setCountryFilter('');
  };

  const hasFilters = dosageForm || certification || tierFilter || cqsMin > 0 || countryFilter;

  const filterContent = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Dosage Form */}
      <FilterSection title="Dosage Form">
        {['Tablet', 'Capsule', 'Syrup', 'Injectable', 'Cream'].map(form => (
          <FilterCheckbox
            key={form}
            label={form}
            checked={dosageForm === form}
            onChange={() => setDosageForm(dosageForm === form ? '' : form)}
            count={products.filter(p => p.dosageFormShort === form).length}
          />
        ))}
      </FilterSection>

      <FilterSection title="Certifications">
        {['WHO-GMP', 'SFDA', 'DRAP-GMP', 'NMPA'].map(cert => (
          <FilterCheckbox
            key={cert}
            label={cert}
            checked={certification === cert}
            onChange={() => setCertification(certification === cert ? '' : cert)}
            count={products.filter(p => p.certifications.includes(cert)).length}
          />
        ))}
      </FilterSection>

      <FilterSection title="Manufacturer Tier">
        {['Tier 1', 'Tier 2', 'Tier 3'].map(tier => (
          <FilterCheckbox
            key={tier}
            label={tier}
            checked={tierFilter === tier}
            onChange={() => setTierFilter(tierFilter === tier ? '' : tier)}
            count={products.filter(p => p.tier === tier).length}
          />
        ))}
      </FilterSection>

      <FilterSection title="CQS Score">
        {[
          { label: '80+ (Excellent)', min: 80 },
          { label: '60-79 (Good)', min: 60 },
          { label: 'All', min: 0 },
        ].map(opt => (
          <FilterCheckbox
            key={opt.min}
            label={opt.label}
            checked={cqsMin === opt.min}
            onChange={() => setCqsMin(cqsMin === opt.min ? 0 : opt.min)}
            count={products.filter(p => opt.min === 0 ? true : (opt.min === 80 ? p.cqs >= 80 : (p.cqs >= 60 && p.cqs < 80))).length}
          />
        ))}
      </FilterSection>

      <FilterSection title="Destination Country">
        {['Saudi Arabia', 'UAE', 'Kenya', 'Nigeria', 'Sri Lanka'].map(country => (
          <FilterCheckbox
            key={country}
            label={country}
            checked={countryFilter === country}
            onChange={() => setCountryFilter(countryFilter === country ? '' : country)}
            count={products.filter(p => p.exportCountries.includes(country)).length}
          />
        ))}
      </FilterSection>
    </div>
  );

  const searchJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Pharmaceutical Products${query ? ': ' + query : ''}`,
    numberOfItems: results.length,
    itemListElement: results.slice(0, 10).map((product, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Product',
        name: `${product.inn} ${product.strength}`,
        url: `https://pmexchange.pk/marketplace/product/${product.id}`,
        manufacturer: { '@type': 'Organization', name: product.manufacturerName },
        offers: {
          '@type': 'AggregateOffer',
          priceCurrency: 'USD',
          lowPrice: product.priceLow,
          highPrice: product.priceHigh,
        },
      },
    })),
  };

  const searchTitle = query
    ? `${query} \u2014 Pharmaceutical Products | PMX Pharma Exchange`
    : 'Browse All Pharmaceutical Products | PMX Pharma Exchange';
  const searchDescription = query
    ? `Find ${query} from DRAP-certified Pakistani manufacturers. ${results.length} products found. WHO-GMP verified. Compare prices and quality scores on PMX Pharma Exchange.`
    : `Browse 200+ export-ready pharmaceutical products from verified Pakistani manufacturers. Filter by category, certification, and CQS score.`;

  return (
    <main style={{ background: '#F8FAFC', minHeight: 'calc(100vh - 72px)' }}>
      <title>{searchTitle}</title>
      <meta name="description" content={searchDescription} />
      <meta property="og:title" content={searchTitle} />
      <meta property="og:description" content={searchDescription} />
      <link rel="canonical" href={`https://pmexchange.pk/marketplace/search${query ? `?q=${encodeURIComponent(query)}` : ''}`} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(searchJsonLd) }}
      />
      {/* Full-width search bar */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', padding: '20px 32px' }}>
        <form onSubmit={handleSearch} style={{
          display: 'flex',
          maxWidth: 1260,
          margin: '0 auto',
          background: '#F8FAFC',
          borderRadius: 14,
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
        }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)' }}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
            <input
              type="text"
              placeholder="Search medicines, manufacturers, categories..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '16px 16px 16px 48px',
                border: 'none',
                outline: 'none',
                fontSize: 15,
                fontFamily: "'DM Sans', sans-serif",
                color: '#0F172A',
                background: 'transparent',
              }}
            />
          </div>
          <button type="submit" style={{
            padding: '16px 28px',
            background: '#1D9E75',
            color: '#fff',
            border: 'none',
            fontWeight: 600,
            fontSize: 14,
            fontFamily: "'DM Sans', sans-serif",
            cursor: 'pointer',
          }}>
            Search
          </button>
        </form>
      </div>

      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '24px 32px' }}>
        {/* Results header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <div>
            <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, color: '#0F172A' }}>
              {results.length} product{results.length !== 1 ? 's' : ''} found
            </span>
            {query && (
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: '#64748B', marginLeft: 8 }}>
                for &ldquo;{query}&rdquo;
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Mobile filter toggle */}
            <button
              onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
              className="mk-mobile-filter-btn"
              style={{
                display: 'none',
                padding: '10px 18px',
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                color: '#64748B',
                border: '1px solid #E2E8F0',
                borderRadius: 10,
                background: '#fff',
                cursor: 'pointer',
                gap: 6,
                alignItems: 'center',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>
              Filters {hasFilters ? '(active)' : ''}
            </button>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={{
                padding: '10px 14px',
                fontSize: 13,
                fontFamily: "'DM Sans', sans-serif",
                border: '1px solid #E2E8F0',
                borderRadius: 10,
                background: '#fff',
                color: '#0F172A',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="relevance">Sort: Relevance</option>
              <option value="cqs">Sort: CQS Score</option>
              <option value="price-low">Sort: Price Low-High</option>
              <option value="price-high">Sort: Price High-Low</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }}>
          {/* Left sidebar filters */}
          <div className="mk-filter-sidebar" style={{ width: 260, flexShrink: 0 }}>
            <div style={{
              padding: 24,
              background: '#FFFFFF',
              borderRadius: 16,
              border: '1px solid #E2E8F0',
              position: 'sticky',
              top: 96,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 18, color: '#0F172A' }}>Filters</h3>
                {hasFilters && (
                  <button
                    onClick={clearFilters}
                    style={{
                      fontSize: 12,
                      color: '#1D9E75',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    Clear all
                  </button>
                )}
              </div>
              {filterContent}
            </div>
          </div>

          {/* Mobile filters overlay */}
          {mobileFiltersOpen && (
            <div className="mk-mobile-filter-panel" style={{
              position: 'fixed',
              inset: 0,
              zIndex: 200,
              background: 'rgba(15,23,42,0.4)',
              backdropFilter: 'blur(4px)',
            }} onClick={() => setMobileFiltersOpen(false)}>
              <div style={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: 320,
                background: '#fff',
                overflowY: 'auto',
                boxShadow: '-8px 0 40px rgba(0,0,0,0.08)',
                animation: 'slideInRight 0.25s ease forwards',
              }} onClick={e => e.stopPropagation()}>
                <div style={{
                  padding: '20px 24px',
                  borderBottom: '1px solid #E2E8F0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  position: 'sticky',
                  top: 0,
                  background: '#fff',
                  zIndex: 1,
                }}>
                  <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: 18, color: '#0F172A' }}>Filters</span>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    {hasFilters && (
                      <button onClick={clearFilters} style={{ fontSize: 12, color: '#1D9E75', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
                        Clear all
                      </button>
                    )}
                    <button
                      onClick={() => setMobileFiltersOpen(false)}
                      style={{ width: 36, height: 36, border: '1px solid #E2E8F0', borderRadius: 8, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                  </div>
                </div>
                <div style={{ padding: 24 }}>
                  {filterContent}
                </div>
              </div>
            </div>
          )}

          {/* Products grid */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {results.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '80px 24px',
                background: '#FFFFFF',
                borderRadius: 16,
                border: '1px solid #E2E8F0',
              }}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#E2E8F0" strokeWidth="1.5" style={{ margin: '0 auto 20px', display: 'block' }}>
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                </svg>
                <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, color: '#0F172A', marginBottom: 8 }}>
                  No products found
                </h3>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#64748B', marginBottom: 24, maxWidth: 360, margin: '0 auto 24px' }}>
                  Try adjusting your search terms or clearing filters to see more results.
                </p>
                <button
                  onClick={() => { setQuery(''); clearFilters(); }}
                  style={{
                    padding: '12px 24px',
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: "'DM Sans', sans-serif",
                    color: '#fff',
                    background: '#1D9E75',
                    border: 'none',
                    borderRadius: 10,
                    cursor: 'pointer',
                  }}
                >
                  Clear search &amp; filters
                </button>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 16,
              }}>
                {results.map((product, i) => (
                  <SearchProductCard key={product.id} product={product} index={i} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @media (max-width: 900px) {
          .mk-filter-sidebar {
            display: none !important;
          }
          .mk-mobile-filter-btn {
            display: flex !important;
          }
        }
        @media (min-width: 901px) {
          .mk-mobile-filter-panel {
            display: none !important;
          }
        }
      `}</style>
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div style={{ padding: 80, textAlign: 'center', fontFamily: "'DM Sans', sans-serif", color: '#94A3B8' }}>Loading search...</div>
    }>
      <SearchContent />
    </Suspense>
  );
}

// Filter section
function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: 0,
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          marginBottom: open ? 12 : 0,
        }}
      >
        <span style={{
          fontSize: 12,
          fontWeight: 700,
          fontFamily: "'DM Sans', sans-serif",
          color: '#0F172A',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}>
          {title}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {children}
        </div>
      )}
    </div>
  );
}

// Filter checkbox
function FilterCheckbox({ label, checked, onChange, count }: {
  label: string; checked: boolean; onChange: () => void; count: number;
}) {
  return (
    <label style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      cursor: 'pointer',
      fontSize: 13,
      fontFamily: "'DM Sans', sans-serif",
      color: checked ? '#1D9E75' : '#64748B',
      fontWeight: checked ? 600 : 400,
      padding: '2px 0',
    }}>
      <div style={{
        width: 18,
        height: 18,
        borderRadius: 5,
        border: checked ? 'none' : '1.5px solid #CBD5E1',
        background: checked ? '#1D9E75' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        transition: 'all 0.15s ease',
      }}>
        {checked && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        )}
      </div>
      <span style={{ flex: 1 }}>{label}</span>
      <span style={{
        fontSize: 11,
        color: '#94A3B8',
        background: '#F1F5F9',
        padding: '2px 7px',
        borderRadius: 6,
        fontWeight: 500,
      }}>
        {count}
      </span>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ display: 'none' }} />
    </label>
  );
}

// Search product card
function SearchProductCard({ product, index }: { product: typeof products[0]; index: number }) {
  return (
    <article
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 16,
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        opacity: 0,
        animation: 'staggerReveal 0.5s ease forwards',
        animationDelay: `${Math.min(index, 8) * 0.04}s`,
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.08)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      {/* Image area */}
      <div style={{
        height: 120,
        background: getProductGradient(product.dosageFormShort),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}>
        <img
          src={product.image}
          alt={`${product.inn} ${product.strength}`}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.18) 0%, transparent 50%)' }} />
        {/* Cert badges */}
        <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 4 }}>
          {product.certifications.slice(0, 2).map(cert => (
            <span key={cert} style={{
              padding: '2px 7px',
              borderRadius: 5,
              fontSize: 10,
              fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
              background: cert === 'WHO-GMP' ? 'rgba(29,158,117,0.15)' : cert === 'SFDA' ? 'rgba(24,95,165,0.12)' : 'rgba(255,255,255,0.8)',
              color: cert === 'WHO-GMP' ? '#1D9E75' : cert === 'SFDA' ? '#185FA5' : '#64748B',
              backdropFilter: 'blur(4px)',
            }}>
              {cert}
            </span>
          ))}
        </div>
        {/* CQS */}
        <div style={{
          position: 'absolute',
          top: 10,
          right: 10,
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: getCqsBg(product.cqsBadge),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 11,
          fontWeight: 700,
          color: getCqsColor(product.cqsBadge),
        }}>
          {product.cqs > 0 ? product.cqs : '--'}
        </div>
      </div>

      <div style={{ padding: '16px 18px 18px' }}>
        <Link href={`/marketplace/product/${product.id}`} style={{ textDecoration: 'none' }}>
          <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 16, color: '#0F172A', marginBottom: 2, lineHeight: 1.3 }}>
            {product.inn} {product.strength}
          </div>
        </Link>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#94A3B8', marginBottom: 8 }}>
          {product.dosageForm} &bull; {product.brandName}
        </div>

        {/* Manufacturer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <Link href={`/marketplace/seller/${product.manufacturerId}`} style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12,
            color: '#1D9E75',
            fontWeight: 600,
            textDecoration: 'none',
          }}>
            {product.manufacturerName}
          </Link>
          {product.pmxCertified && (
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#1D9E75', display: 'inline-block' }} />
          )}
        </div>

        <div style={{ height: 1, background: '#E2E8F0', marginBottom: 12 }} />

        {/* Price */}
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, fontWeight: 700, color: '#1D9E75', marginBottom: 3 }}>
          {product.priceRange}
        </div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#94A3B8', marginBottom: 14 }}>
          {product.moq} &bull; {product.annualCapacity}
        </div>

        {/* CTA */}
        <Link href="/" style={{
          display: 'block',
          padding: '10px',
          textAlign: 'center',
          fontSize: 13,
          fontWeight: 600,
          fontFamily: "'DM Sans', sans-serif",
          color: '#fff',
          background: '#1D9E75',
          borderRadius: 10,
          textDecoration: 'none',
        }}>
          Request Quote
        </Link>
      </div>
    </article>
  );
}
