'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getManufacturer, getProductsByManufacturer, manufacturers } from '../../data';

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

function getBarColor(value: number): string {
  if (value >= 80) return '#1D9E75';
  if (value >= 60) return '#D4A843';
  return '#A32D2D';
}

export default function SellerProfilePage() {
  const params = useParams();
  const sellerId = params.id as string;
  const manufacturer = getManufacturer(sellerId);

  if (!manufacturer) {
    return (
      <div style={{ maxWidth: 600, margin: '120px auto', textAlign: 'center', padding: 40 }}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#E2E8F0" strokeWidth="1.5" style={{ margin: '0 auto 24px', display: 'block' }}>
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 28, color: '#0F172A', marginBottom: 8 }}>
          Manufacturer Not Found
        </h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: '#64748B', marginBottom: 28 }}>
          The manufacturer you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Link href="/marketplace" style={{
          padding: '12px 28px', fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
          color: '#fff', background: '#1D9E75', borderRadius: 10, textDecoration: 'none',
        }}>
          Back to Marketplace
        </Link>
      </div>
    );
  }

  const sellerProducts = getProductsByManufacturer(sellerId);
  const cqsColor = getCqsColor(manufacturer.cqsBadge);

  return (
    <div style={{ background: '#F8FAFC', minHeight: 'calc(100vh - 72px)' }}>
      {/* ===== HEADER ===== */}
      <div style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        padding: '48px 32px 56px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Subtle mesh pattern */}
        <div style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.04,
          backgroundImage: `repeating-linear-gradient(
            45deg, transparent, transparent 40px,
            rgba(29,158,117,0.2) 40px, rgba(29,158,117,0.2) 41px
          )`,
        }} />
        {/* Glow */}
        <div style={{
          position: 'absolute',
          top: '-40%',
          right: '-10%',
          width: '50%',
          height: '160%',
          background: 'radial-gradient(ellipse at center, rgba(29,158,117,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 1320, margin: '0 auto', position: 'relative' }}>
          {/* Breadcrumbs */}
          <nav style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 28,
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            color: '#64748B',
          }}>
            <Link href="/marketplace" style={{ color: '#64748B', textDecoration: 'none' }}>Marketplace</Link>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            <span style={{ color: '#94A3B8', fontWeight: 500 }}>{manufacturer.name}</span>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
            {/* CQS circle */}
            <div style={{
              width: 100,
              height: 100,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              flexShrink: 0,
            }}>
              <svg width="100" height="100" viewBox="0 0 100 100" style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
                <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
                <circle cx="50" cy="50" r="44" fill="none" stroke={cqsColor} strokeWidth="5"
                  strokeDasharray={`${(manufacturer.cqs / 100) * 276} 276`}
                  strokeLinecap="round" style={{ transition: 'stroke-dasharray 1.2s ease' }} />
              </svg>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 28, fontWeight: 700, color: cqsColor }}>
                  {manufacturer.cqs > 0 ? manufacturer.cqs : '--'}
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  CQS
                </div>
              </div>
            </div>

            {/* Company info */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
                <h1 style={{
                  fontFamily: "'Instrument Serif', serif",
                  fontSize: 'clamp(24px, 4vw, 34px)',
                  fontWeight: 400,
                  color: '#fff',
                  lineHeight: 1.2,
                }}>
                  {manufacturer.name}
                </h1>
                {manufacturer.pmxCertified && (
                  <span style={{
                    padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 600,
                    fontFamily: "'DM Sans', sans-serif",
                    background: 'rgba(29,158,117,0.15)', color: '#1D9E75',
                  }}>
                    PMX-Certified
                  </span>
                )}
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#94A3B8', marginBottom: 12 }}>
                {manufacturer.city}, Pakistan &bull; {manufacturer.tierLabel}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {manufacturer.certifications.map(cert => (
                  <span key={cert} style={{
                    padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    fontFamily: "'DM Sans', sans-serif",
                    background: cert === 'WHO-GMP' ? 'rgba(29,158,117,0.12)' : cert === 'SFDA' ? 'rgba(24,95,165,0.1)' : 'rgba(255,255,255,0.08)',
                    color: cert === 'WHO-GMP' ? '#1D9E75' : cert === 'SFDA' ? '#60A5FA' : '#94A3B8',
                  }}>
                    {cert}
                  </span>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
              <Link href="/" style={{
                padding: '14px 32px', fontSize: 14, fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                color: '#fff', background: '#1D9E75', borderRadius: 12, textDecoration: 'none',
                transition: 'all 0.2s ease',
              }}>
                Request Quote
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ===== BODY ===== */}
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '28px 32px' }}>
        <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* LEFT SIDEBAR */}
          <div style={{ flex: '0 0 340px', maxWidth: '100%' }}>
            {/* Stats Card */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: 20,
              border: '1px solid #E2E8F0',
              padding: '24px',
              marginBottom: 20,
            }}>
              <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 18, color: '#0F172A', marginBottom: 18 }}>
                Supplier Stats
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                  { label: 'Products', value: String(manufacturer.productCount) },
                  { label: 'Orders', value: String(manufacturer.ordersCompleted) },
                  { label: 'Response Rate', value: manufacturer.responseRate },
                  { label: 'Member Since', value: manufacturer.memberSince },
                ].map((stat, i) => (
                  <div key={i} style={{
                    padding: '14px 16px',
                    background: '#F8FAFC',
                    borderRadius: 12,
                  }}>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#94A3B8', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {stat.label}
                    </div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, fontWeight: 700, color: '#0F172A' }}>
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CQS Breakdown */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: 20,
              border: '1px solid #E2E8F0',
              padding: '24px',
              marginBottom: 20,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 18, color: '#0F172A' }}>
                  CQS Breakdown
                </h3>
                <div style={{
                  padding: '6px 14px', borderRadius: 10,
                  fontFamily: "'IBM Plex Mono', monospace", fontSize: 14, fontWeight: 700,
                  background: getCqsBg(manufacturer.cqsBadge), color: cqsColor,
                }}>
                  {manufacturer.cqs > 0 ? manufacturer.cqs : 'Pending'}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {manufacturer.cqsDimensions.map((dim, i) => {
                  const barColor = getBarColor(dim.value);
                  return (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#64748B' }}>{dim.label}</span>
                        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, fontWeight: 700, color: barColor }}>{dim.value}</span>
                      </div>
                      <div style={{
                        height: 6,
                        background: '#F1F5F9',
                        borderRadius: 3,
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${dim.value}%`,
                          background: barColor,
                          borderRadius: 3,
                          transition: 'width 0.8s ease',
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Certifications */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: 20,
              border: '1px solid #E2E8F0',
              padding: '24px',
            }}>
              <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 18, color: '#0F172A', marginBottom: 18 }}>
                Certifications Held
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {manufacturer.certifications.map(cert => (
                  <div key={cert} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '12px 16px',
                    borderRadius: 12,
                    background: '#F8FAFC',
                    border: '1px solid #F1F5F9',
                  }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: cert === 'WHO-GMP' ? 'rgba(29,158,117,0.08)' : cert === 'SFDA' ? 'rgba(24,95,165,0.06)' : '#F1F5F9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: cert === 'WHO-GMP' ? '#1D9E75' : cert === 'SFDA' ? '#185FA5' : '#64748B',
                      flexShrink: 0,
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{cert}</div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#94A3B8' }}>
                        {cert === 'WHO-GMP' ? 'Valid to Dec 2026' :
                         cert === 'SFDA' ? 'Valid to Sep 2026' :
                         cert === 'DRAP-GMP' ? 'Valid to Jun 2027' :
                         cert === 'ISO 9001:2015' ? 'Valid to Mar 2027' : 'Active'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT — Product Catalog */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}>
              <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 24, color: '#0F172A' }}>
                Product Catalog ({sellerProducts.length})
              </h2>
            </div>

            {sellerProducts.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '60px 24px',
                background: '#FFFFFF',
                borderRadius: 16,
                border: '1px solid #E2E8F0',
              }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#E2E8F0" strokeWidth="1.5" style={{ margin: '0 auto 16px', display: 'block' }}>
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                </svg>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#64748B' }}>
                  This manufacturer hasn&apos;t listed any products yet.
                </p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 16,
              }}>
                {sellerProducts.map((product, i) => (
                  <div
                    key={product.id}
                    style={{
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
                      height: 120,
                      background: getProductGradient(product.dosageFormShort),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                    }}>
                      <span style={{ fontSize: 40, opacity: 0.3 }}>
                        {product.dosageFormShort === 'Syrup' ? '\uD83E\uDDEA' : '\uD83D\uDC8A'}
                      </span>
                      <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 4 }}>
                        {product.certifications.slice(0, 2).map(cert => (
                          <span key={cert} style={{
                            padding: '2px 7px', borderRadius: 5, fontSize: 10, fontWeight: 600,
                            fontFamily: "'DM Sans', sans-serif",
                            background: cert === 'WHO-GMP' ? 'rgba(29,158,117,0.15)' : cert === 'SFDA' ? 'rgba(24,95,165,0.12)' : 'rgba(255,255,255,0.8)',
                            color: cert === 'WHO-GMP' ? '#1D9E75' : cert === 'SFDA' ? '#185FA5' : '#64748B',
                            backdropFilter: 'blur(4px)',
                          }}>
                            {cert}
                          </span>
                        ))}
                      </div>
                      <div style={{
                        position: 'absolute', top: 10, right: 10,
                        width: 36, height: 36, borderRadius: '50%',
                        background: getCqsBg(product.cqsBadge),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 700,
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
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#94A3B8', marginBottom: 10 }}>
                        {product.brandName} &bull; {product.dosageForm}
                      </div>

                      <div style={{ height: 1, background: '#E2E8F0', marginBottom: 10 }} />

                      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, fontWeight: 700, color: '#1D9E75', marginBottom: 3 }}>
                        {product.priceRange}
                      </div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#94A3B8', marginBottom: 14 }}>
                        {product.moq} &bull; {product.annualCapacity}
                      </div>

                      <div style={{ display: 'flex', gap: 8 }}>
                        <Link href={`/marketplace/product/${product.id}`} style={{
                          flex: 1, padding: '9px', textAlign: 'center', fontSize: 12, fontWeight: 600,
                          fontFamily: "'DM Sans', sans-serif",
                          color: '#64748B', border: '1px solid #E2E8F0', borderRadius: 10, textDecoration: 'none',
                        }}>
                          View Details
                        </Link>
                        <Link href="/" style={{
                          flex: 1, padding: '9px', textAlign: 'center', fontSize: 12, fontWeight: 600,
                          fontFamily: "'DM Sans', sans-serif",
                          color: '#fff', background: '#1D9E75', borderRadius: 10, textDecoration: 'none',
                        }}>
                          Request Quote
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Other Verified Manufacturers */}
            <div style={{
              marginTop: 48,
              padding: '28px',
              background: '#FFFFFF',
              borderRadius: 20,
              border: '1px solid #E2E8F0',
            }}>
              <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 20, color: '#0F172A', marginBottom: 20 }}>
                Other Verified Manufacturers
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: 12,
              }}>
                {manufacturers
                  .filter(m => m.id !== sellerId && !m.suspended && m.cqs > 0)
                  .slice(0, 4)
                  .map((m, i) => (
                    <Link key={m.id} href={`/marketplace/seller/${m.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{
                        padding: '16px 18px',
                        border: '1px solid #E2E8F0',
                        borderRadius: 14,
                        background: '#FFFFFF',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        opacity: 0,
                        animation: 'staggerReveal 0.5s ease forwards',
                        animationDelay: `${i * 0.08}s`,
                      }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.06)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                      >
                        {/* Mini CQS ring */}
                        <div style={{
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                          flexShrink: 0,
                        }}>
                          <svg width="44" height="44" viewBox="0 0 44 44" style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
                            <circle cx="22" cy="22" r="18" fill="none" stroke="#F1F5F9" strokeWidth="3" />
                            <circle cx="22" cy="22" r="18" fill="none" stroke={getCqsColor(m.cqsBadge)} strokeWidth="3"
                              strokeDasharray={`${(m.cqs / 100) * 113} 113`}
                              strokeLinecap="round" />
                          </svg>
                          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, fontWeight: 700, color: getCqsColor(m.cqsBadge) }}>
                            {m.cqs}
                          </span>
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {m.name}
                          </div>
                          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#94A3B8' }}>
                            {m.city} &bull; {m.tier}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
              </div>
            </div>
          </div>
        </div>
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
