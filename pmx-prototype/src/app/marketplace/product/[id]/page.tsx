'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getProduct, getManufacturer, products } from '../../data';

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

function getProductGradient(form: string): string {
  switch (form) {
    case 'Capsule': return 'linear-gradient(135deg, #FAEEDA 0%, #E1F5EE 100%)';
    case 'Syrup': return 'linear-gradient(135deg, #E6F1FB 0%, #F1EFE8 100%)';
    default: return 'linear-gradient(135deg, #E1F5EE 0%, #E6F1FB 100%)';
  }
}

const countryFlags: Record<string, string> = {
  'Saudi Arabia': '\uD83C\uDDF8\uD83C\uDDE6',
  'UAE': '\uD83C\uDDE6\uD83C\uDDEA',
  'Kenya': '\uD83C\uDDF0\uD83C\uDDEA',
  'Nigeria': '\uD83C\uDDF3\uD83C\uDDEC',
  'Sri Lanka': '\uD83C\uDDF1\uD83C\uDDF0',
  'Tanzania': '\uD83C\uDDF9\uD83C\uDDFF',
  'Uganda': '\uD83C\uDDFA\uD83C\uDDEC',
  'Ghana': '\uD83C\uDDEC\uD83C\uDDED',
  'Myanmar': '\uD83C\uDDF2\uD83C\uDDF2',
  'Afghanistan': '\uD83C\uDDE6\uD83C\uDDEB',
  'Oman': '\uD83C\uDDF4\uD83C\uDDF2',
  'Bahrain': '\uD83C\uDDE7\uD83C\uDDED',
};

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;
  const product = getProduct(productId);

  if (!product) {
    return (
      <div style={{ maxWidth: 600, margin: '120px auto', textAlign: 'center', padding: 40 }}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#E2E8F0" strokeWidth="1.5" style={{ margin: '0 auto 24px', display: 'block' }}>
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
        </svg>
        <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 28, color: '#0F172A', marginBottom: 8 }}>
          Product Not Found
        </h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: '#64748B', marginBottom: 28 }}>
          The product you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Link href="/marketplace/search?q=" style={{
          padding: '12px 28px', fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
          color: '#fff', background: '#1D9E75', borderRadius: 10, textDecoration: 'none',
        }}>
          Browse Products
        </Link>
      </div>
    );
  }

  const manufacturer = getManufacturer(product.manufacturerId);
  const relatedProducts = products
    .filter(p => p.id !== product.id && (p.category === product.category || p.inn === product.inn))
    .slice(0, 4);

  const cqsColor = getCqsColor(product.cqsBadge);
  const mfrCqsColor = manufacturer ? getCqsColor(manufacturer.cqsBadge) : '#94A3B8';

  return (
    <div style={{ background: '#F8FAFC', minHeight: 'calc(100vh - 72px)' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '28px 32px' }}>
        {/* Breadcrumbs */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 28,
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 13,
          color: '#94A3B8',
        }}>
          <Link href="/marketplace" style={{ color: '#94A3B8', textDecoration: 'none', transition: 'color 0.2s' }}>Marketplace</Link>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          <Link href={`/marketplace/search?q=${encodeURIComponent(product.category)}`} style={{ color: '#94A3B8', textDecoration: 'none' }}>
            {product.category}
          </Link>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          <span style={{ color: '#64748B', fontWeight: 500 }}>{product.inn} {product.strength}</span>
        </nav>

        <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* ===== LEFT (70%) ===== */}
          <div style={{ flex: '1 1 640px', minWidth: 0 }}>
            {/* Product header card */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: 20,
              border: '1px solid #E2E8F0',
              overflow: 'hidden',
              marginBottom: 24,
            }}>
              {/* Big product image area */}
              <div style={{
                height: 280,
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
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.22) 0%, transparent 40%)' }} />
                {/* DRAP + certs */}
                <div style={{ position: 'absolute', top: 20, left: 20, display: 'flex', gap: 6 }}>
                  <span style={{
                    padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    fontFamily: "'DM Sans', sans-serif",
                    background: 'rgba(29,158,117,0.15)', color: '#1D9E75', backdropFilter: 'blur(8px)',
                  }}>
                    DRAP Registered
                  </span>
                  {product.pmxCertified && (
                    <span style={{
                      padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                      fontFamily: "'DM Sans', sans-serif",
                      background: 'rgba(29,158,117,0.15)', color: '#1D9E75', backdropFilter: 'blur(8px)',
                    }}>
                      PMX-Certified
                    </span>
                  )}
                </div>
                {/* CQS badge */}
                <div style={{
                  position: 'absolute', top: 20, right: 20,
                  padding: '8px 16px', borderRadius: 10,
                  fontFamily: "'IBM Plex Mono', monospace", fontSize: 15, fontWeight: 700,
                  background: getCqsBg(product.cqsBadge), color: cqsColor,
                  backdropFilter: 'blur(8px)',
                }}>
                  CQS {product.cqs > 0 ? product.cqs : 'Pending'}
                </div>
              </div>

              <div style={{ padding: '28px 32px' }}>
                <h1 style={{
                  fontFamily: "'Instrument Serif', serif",
                  fontSize: 'clamp(24px, 4vw, 32px)',
                  fontWeight: 400,
                  color: '#0F172A',
                  marginBottom: 6,
                  lineHeight: 1.2,
                }}>
                  {product.inn} {product.strength}
                </h1>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: '#64748B', marginBottom: 4 }}>
                  {product.brandName} &bull; {product.dosageForm}
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#94A3B8' }}>
                  {product.category} &bull; {product.pharmacopoeia}
                </div>

                {/* Price / MOQ / Capacity box */}
                <div style={{
                  display: 'flex',
                  gap: 0,
                  marginTop: 24,
                  padding: 0,
                  background: '#F8FAFC',
                  borderRadius: 14,
                  border: '1px solid #E2E8F0',
                  overflow: 'hidden',
                }}>
                  {[
                    { label: 'Price Range', value: product.priceRange, accent: true },
                    { label: 'Minimum Order', value: product.moq },
                    { label: 'Annual Capacity', value: product.annualCapacity },
                  ].map((item, i) => (
                    <div key={i} style={{
                      flex: 1,
                      padding: '18px 20px',
                      borderRight: i < 2 ? '1px solid #E2E8F0' : 'none',
                    }}>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                        {item.label}
                      </div>
                      <div style={{
                        fontFamily: item.accent ? "'IBM Plex Mono', monospace" : "'DM Sans', sans-serif",
                        fontSize: item.accent ? 18 : 15,
                        fontWeight: 700,
                        color: item.accent ? '#1D9E75' : '#0F172A',
                      }}>
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Product Specifications */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: 20,
              border: '1px solid #E2E8F0',
              padding: '28px 32px',
              marginBottom: 24,
            }}>
              <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, color: '#0F172A', marginBottom: 24 }}>
                Product Specifications
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: 0,
              }}>
                {[
                  { label: 'INN Name', value: product.inn },
                  { label: 'Brand Name', value: product.brandName },
                  { label: 'Strength', value: product.strength },
                  { label: 'Dosage Form', value: product.dosageForm },
                  { label: 'DRAP Reg No', value: product.drapRegNo, mono: true },
                  { label: 'Pharmacopoeia', value: product.pharmacopoeia },
                  { label: 'Shelf Life', value: product.shelfLife },
                  { label: 'Storage Conditions', value: product.storageConditions },
                  { label: 'Annual Capacity', value: product.annualCapacity },
                  { label: 'Pack Sizes', value: product.packSizes.join(' / ') },
                ].map((spec, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '12px 0',
                    borderBottom: '1px solid #F1F5F9',
                    gap: 16,
                  }}>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#94A3B8', flexShrink: 0 }}>{spec.label}</span>
                    <span style={{
                      fontFamily: spec.mono ? "'IBM Plex Mono', monospace" : "'DM Sans', sans-serif",
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#0F172A',
                      textAlign: 'right',
                    }}>
                      {spec.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Export countries */}
              <div style={{ marginTop: 24 }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#94A3B8', marginBottom: 10 }}>Export Eligible Countries</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {product.exportCountries.map(country => (
                    <span key={country} style={{
                      padding: '6px 12px',
                      borderRadius: 8,
                      fontSize: 13,
                      fontFamily: "'DM Sans', sans-serif",
                      fontWeight: 500,
                      background: '#F1F5F9',
                      color: '#0F172A',
                    }}>
                      {countryFlags[country] || ''} {country}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Quality & Compliance */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: 20,
              border: '1px solid #E2E8F0',
              padding: '28px 32px',
              marginBottom: 24,
            }}>
              <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, color: '#0F172A', marginBottom: 24 }}>
                Quality & Compliance
              </h2>

              {/* Recent CoA */}
              {product.recentCoA.length > 0 && (
                <div style={{ marginBottom: 28 }}>
                  <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 12 }}>
                    Recent Certificates of Analysis
                  </h3>
                  <div style={{ border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1.5fr 0.8fr',
                      padding: '10px 18px',
                      background: '#F8FAFC',
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#94A3B8',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}>
                      <div>Batch</div>
                      <div>Result</div>
                      <div>Date</div>
                    </div>
                    {product.recentCoA.map((coa, i) => (
                      <div key={i} style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1.5fr 0.8fr',
                        padding: '12px 18px',
                        borderTop: '1px solid #F1F5F9',
                        fontSize: 13,
                        fontFamily: "'DM Sans', sans-serif",
                      }}>
                        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, color: '#0F172A', fontSize: 12 }}>
                          {coa.batch}
                        </div>
                        <div style={{
                          fontWeight: 600,
                          color: coa.result.startsWith('Pass') ? '#1D9E75' : coa.result.includes('Progress') ? '#185FA5' : '#D4A843',
                        }}>
                          {coa.result}
                        </div>
                        <div style={{ color: '#64748B' }}>{coa.date}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* QC Tests */}
              <div style={{ marginBottom: 28 }}>
                <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 12 }}>
                  QC Tests Performed
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {product.qcTests.map(test => (
                    <span key={test} style={{
                      padding: '5px 12px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontFamily: "'DM Sans', sans-serif",
                      fontWeight: 500,
                      background: 'rgba(29,158,117,0.08)',
                      color: '#1D9E75',
                    }}>
                      {test}
                    </span>
                  ))}
                </div>
              </div>

              {/* Compliance note */}
              <div style={{
                padding: '16px 20px',
                background: 'rgba(24,95,165,0.06)',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
                border: '1px solid rgba(24,95,165,0.1)',
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#185FA5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                <div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: '#185FA5', marginBottom: 4 }}>
                    21 CFR Part 11 Compliant Manufacturing
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#64748B', lineHeight: 1.6 }}>
                    This product is manufactured in a facility with electronic batch records, audit trails, and electronic signatures compliant with 21 CFR Part 11 requirements.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ===== RIGHT (30%) - Supplier Card ===== */}
          <div style={{ flex: '0 0 380px', maxWidth: '100%' }}>
            <div style={{
              background: '#FFFFFF',
              borderRadius: 20,
              border: '1px solid #E2E8F0',
              padding: '28px',
              position: 'sticky',
              top: 100,
            }}>
              {/* CQS Ring */}
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{
                  width: 96,
                  height: 96,
                  borderRadius: '50%',
                  margin: '0 auto 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}>
                  <svg width="96" height="96" viewBox="0 0 96 96" style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
                    <circle cx="48" cy="48" r="42" fill="none" stroke="#F1F5F9" strokeWidth="5" />
                    <circle cx="48" cy="48" r="42" fill="none" stroke={mfrCqsColor} strokeWidth="5"
                      strokeDasharray={`${((manufacturer?.cqs || 0) / 100) * 264} 264`}
                      strokeLinecap="round" style={{ transition: 'stroke-dasharray 1.2s ease' }} />
                  </svg>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 26, fontWeight: 700, color: mfrCqsColor }}>
                      {manufacturer?.cqs ? manufacturer.cqs : '--'}
                    </div>
                  </div>
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Composite Quality Score
                </div>
              </div>

              {/* Company info */}
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <Link href={`/marketplace/seller/${product.manufacturerId}`} style={{
                  fontFamily: "'Instrument Serif', serif",
                  fontSize: 20,
                  color: '#0F172A',
                  textDecoration: 'none',
                }}>
                  {product.manufacturerName}
                </Link>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#64748B', marginTop: 4 }}>
                  {manufacturer?.city}, Pakistan
                </div>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 10, flexWrap: 'wrap' }}>
                  {manufacturer?.pmxCertified && (
                    <span style={{
                      padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 600,
                      fontFamily: "'DM Sans', sans-serif",
                      background: 'rgba(29,158,117,0.1)', color: '#1D9E75',
                    }}>
                      PMX-Certified
                    </span>
                  )}
                  <span style={{
                    padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 600,
                    fontFamily: "'DM Sans', sans-serif",
                    background: '#F1F5F9', color: '#64748B',
                  }}>
                    {product.tier}
                  </span>
                </div>
              </div>

              {/* Certifications */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                  Certifications
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {manufacturer?.certifications.map(cert => (
                    <div key={cert} style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '4px 10px', borderRadius: 8,
                      fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                      background: cert === 'WHO-GMP' ? 'rgba(29,158,117,0.08)' : cert === 'SFDA' ? 'rgba(24,95,165,0.06)' : '#F1F5F9',
                      color: cert === 'WHO-GMP' ? '#1D9E75' : cert === 'SFDA' ? '#185FA5' : '#64748B',
                    }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      {cert}
                    </div>
                  ))}
                </div>
              </div>

              {/* Supplier stats */}
              <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 18, marginBottom: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  {[
                    { label: 'Orders', value: String(manufacturer?.ordersCompleted || 0) },
                    { label: 'Response Rate', value: manufacturer?.responseRate || '--' },
                    { label: 'Avg Time', value: manufacturer?.avgResponseTime || '--' },
                    { label: 'Member Since', value: manufacturer?.memberSince || '--' },
                  ].map((stat, i) => (
                    <div key={i}>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#94A3B8', marginBottom: 2 }}>
                        {stat.label}
                      </div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: '#0F172A' }}>
                        {stat.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTAs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Link href="/" style={{
                  padding: '14px',
                  textAlign: 'center',
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: "'DM Sans', sans-serif",
                  color: '#fff',
                  background: '#1D9E75',
                  borderRadius: 12,
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                }}>
                  Request Quote
                </Link>
                <Link href="/" style={{
                  padding: '12px',
                  textAlign: 'center',
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: "'DM Sans', sans-serif",
                  color: '#1D9E75',
                  border: '1px solid #1D9E75',
                  borderRadius: 12,
                  textDecoration: 'none',
                  background: 'transparent',
                }}>
                  Contact Supplier
                </Link>
                <Link href={`/marketplace/seller/${product.manufacturerId}`} style={{
                  textAlign: 'center',
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: "'DM Sans', sans-serif",
                  color: '#64748B',
                  textDecoration: 'none',
                  padding: '8px',
                }}>
                  View All Products &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div style={{ marginTop: 48 }}>
            <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 26, color: '#0F172A', marginBottom: 24 }}>
              Related Products
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 16,
            }}>
              {relatedProducts.map((rp, i) => (
                <Link key={rp.id} href={`/marketplace/product/${rp.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: 16,
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    opacity: 0,
                    animation: 'staggerReveal 0.5s ease forwards',
                    animationDelay: `${i * 0.08}s`,
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.08)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    {/* Image */}
                    <div style={{
                      height: 100,
                      background: getProductGradient(rp.dosageFormShort),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                    }}>
                      <img
                        src={rp.image}
                        alt={`${rp.inn} ${rp.strength}`}
                        loading="lazy"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
                      />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.15) 0%, transparent 50%)' }} />
                      <div style={{
                        position: 'absolute', top: 8, right: 8,
                        width: 32, height: 32, borderRadius: '50%',
                        background: getCqsBg(rp.cqsBadge), display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 700, color: getCqsColor(rp.cqsBadge),
                      }}>
                        {rp.cqs > 0 ? rp.cqs : '--'}
                      </div>
                    </div>
                    <div style={{ padding: '14px 18px' }}>
                      <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 16, color: '#0F172A', marginBottom: 2 }}>
                        {rp.inn} {rp.strength}
                      </div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#94A3B8', marginBottom: 6 }}>
                        {rp.dosageForm} &bull; {rp.brandName}
                      </div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#1D9E75', fontWeight: 600, marginBottom: 8 }}>
                        {rp.manufacturerName}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, fontWeight: 700, color: '#1D9E75' }}>{rp.priceRange}</span>
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#94A3B8' }}>{rp.moq}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes staggerReveal {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
