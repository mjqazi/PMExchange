'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { products, manufacturers, categories } from './data';

const categoryImages: Record<string, string> = {
  'Cardiovascular': 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=400&h=300&fit=crop',
  'Anti-Diabetics': 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=400&h=300&fit=crop',
  'Anti-Infectives': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=300&fit=crop',
  'Analgesics & NSAIDs': 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=400&h=300&fit=crop',
  'Gastrointestinal': 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400&h=300&fit=crop',
  'Respiratory': 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=300&fit=crop',
};

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

// Intersection observer hook for scroll animations
function useInView(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setInView(true);
    }, { threshold: 0.1, ...options });
    observer.observe(el);
    return () => observer.disconnect();
  }, [options]);
  return { ref, inView };
}

export default function MarketplaceLanding() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/marketplace/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const featuredProducts = products.filter(p => p.cqs > 0).slice(0, 8);
  const topManufacturers = manufacturers.filter(m => !m.suspended && m.cqs > 0).slice(0, 4);

  const whySection = useInView();
  const howSection = useInView();

  return (
    <div>
      {/* ===== HERO ===== */}
      <section style={{
        background: '#0F172A',
        position: 'relative',
        overflow: 'hidden',
        padding: '100px 32px 80px',
      }}>
        {/* Background image with overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url(https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=1920&q=80&fit=crop)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.12,
        }} />
        {/* Diagonal mesh pattern */}
        <div style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.06,
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 40px,
            rgba(29,158,117,0.15) 40px,
            rgba(29,158,117,0.15) 41px
          )`,
        }} />
        {/* Gradient orb */}
        <div style={{
          position: 'absolute',
          top: '-20%',
          right: '-10%',
          width: '60%',
          height: '120%',
          background: 'radial-gradient(ellipse at center, rgba(29,158,117,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 820, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <p style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: 'italic',
            fontSize: 'clamp(16px, 2.5vw, 20px)',
            color: '#94A3B8',
            marginBottom: 12,
            opacity: 0,
            animation: 'fadeInUp 0.6s ease 0.1s forwards',
          }}>
            Where compliance meets commerce
          </p>

          <h1 style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: 'clamp(36px, 6vw, 64px)',
            fontWeight: 400,
            color: '#FFFFFF',
            lineHeight: 1.1,
            marginBottom: 20,
            letterSpacing: '-0.02em',
            opacity: 0,
            animation: 'fadeInUp 0.6s ease 0.2s forwards',
          }}>
            Pakistan&apos;s Pharmaceutical{' '}
            <span style={{ color: '#1D9E75' }}>Export Marketplace</span>
          </h1>

          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 'clamp(15px, 2vw, 18px)',
            color: '#94A3B8',
            lineHeight: 1.7,
            maxWidth: 560,
            margin: '0 auto 40px',
            fontWeight: 400,
            opacity: 0,
            animation: 'fadeInUp 0.6s ease 0.3s forwards',
          }}>
            DRAP-certified manufacturers. Quality-scored. Compliance-verified. Escrow-protected transactions for global pharmaceutical buyers.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} style={{
            display: 'flex',
            maxWidth: 640,
            margin: '0 auto 48px',
            background: '#FFFFFF',
            borderRadius: 16,
            boxShadow: '0 8px 40px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.1)',
            overflow: 'hidden',
            opacity: 0,
            animation: 'fadeInUp 0.6s ease 0.4s forwards',
          }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)' }}>
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.3-4.3"/>
              </svg>
              <input
                type="text"
                placeholder="Search medicines... e.g. Metformin, Amoxicillin"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '18px 16px 18px 50px',
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
              padding: '18px 32px',
              background: '#1D9E75',
              color: '#fff',
              border: 'none',
              fontWeight: 600,
              fontSize: 14,
              fontFamily: "'DM Sans', sans-serif",
              cursor: 'pointer',
              letterSpacing: '0.01em',
              whiteSpace: 'nowrap',
            }}>
              Search
            </button>
          </form>

          {/* Stats pills */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 12,
            opacity: 0,
            animation: 'fadeInUp 0.6s ease 0.5s forwards',
          }}>
            {[
              { value: '47', label: 'Manufacturers' },
              { value: '200+', label: 'Products' },
              { value: '23', label: 'Countries' },
              { value: '$2.4M', label: 'Volume' },
            ].map((stat, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 18px',
                background: 'rgba(255,255,255,0.06)',
                borderRadius: 100,
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
                <span style={{ fontSize: 16, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", color: '#1D9E75' }}>
                  {stat.value}
                </span>
                <span style={{ fontSize: 13, fontFamily: "'DM Sans', sans-serif", color: '#94A3B8' }}>
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CATEGORIES ===== */}
      <section style={{ padding: '80px 32px', background: '#FFFFFF' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: 'clamp(28px, 4vw, 40px)',
              fontWeight: 400,
              color: '#0F172A',
              marginBottom: 8,
            }}>
              Browse by Category
            </h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: '#64748B' }}>
              Explore pharmaceutical products across therapeutic areas
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: 16,
          }}>
            {categories.map((cat, i) => (
              <Link
                key={cat.name}
                href={`/marketplace/search?q=${encodeURIComponent(cat.name)}`}
                style={{ textDecoration: 'none', opacity: 0, animation: `staggerReveal 0.5s ease forwards`, animationDelay: `${i * 0.08}s` }}
              >
                <div style={{
                  position: 'relative',
                  height: 180,
                  borderRadius: 16,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.12)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `url(${categoryImages[cat.name] || ''})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }} />
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(135deg, rgba(15,23,42,0.82) 0%, rgba(15,23,42,0.6) 100%)',
                  }} />
                  <div style={{
                    position: 'relative',
                    height: '100%',
                    padding: '24px 28px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                  }}>
                    <div style={{
                      fontFamily: "'Instrument Serif', serif",
                      fontSize: 24,
                      color: '#fff',
                      marginBottom: 4,
                    }}>
                      {cat.name}
                    </div>
                    <div style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 13,
                      color: 'rgba(255,255,255,0.6)',
                      marginBottom: 4,
                    }}>
                      {cat.examples}
                    </div>
                    <div style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#1D9E75',
                    }}>
                      {cat.count} products
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURED PRODUCTS ===== */}
      <section style={{ padding: '80px 32px', background: '#F8FAFC' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h2 style={{
                fontFamily: "'Instrument Serif', serif",
                fontSize: 'clamp(28px, 4vw, 40px)',
                fontWeight: 400,
                color: '#0F172A',
                marginBottom: 4,
              }}>
                Featured Products
              </h2>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: '#64748B' }}>
                Quality-scored products from verified Pakistani manufacturers
              </p>
            </div>
            <Link href="/marketplace/search?q=" style={{
              padding: '10px 24px',
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
              color: '#1D9E75',
              textDecoration: 'none',
              borderRadius: 10,
              border: '1px solid #1D9E75',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
            }}>
              View All Products
            </Link>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 20,
          }}>
            {featuredProducts.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ===== WHY PMX ===== */}
      <section id="why-pmx" ref={whySection.ref} style={{ padding: '100px 32px', background: '#FFFFFF' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <h2 style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: 'clamp(28px, 4vw, 40px)',
              fontWeight: 400,
              color: '#0F172A',
              marginBottom: 8,
            }}>
              Why PMX?
            </h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: '#64748B' }}>
              The trust layer for pharmaceutical trade
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 24,
          }}>
            {[
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    <path d="m9 12 2 2 4-4"/>
                  </svg>
                ),
                title: 'Compliance Verified',
                desc: 'Every manufacturer passes DRAP verification. WHO-GMP, SFDA, and other certifications independently validated before listing.',
                color: '#1D9E75',
              },
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#185FA5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                ),
                title: 'Escrow Protection',
                desc: 'Funds held in escrow until quality-gated milestones are met. Payment releases only after CoA verification and shipment confirmation.',
                color: '#185FA5',
              },
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4A843" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                ),
                title: 'Quality Scored',
                desc: 'Every supplier has a real-time Composite Quality Score based on batch data, deviations, CoA accuracy, and delivery performance.',
                color: '#D4A843',
              },
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
                  </svg>
                ),
                title: 'Regulatory Ready',
                desc: 'Built-in regulatory pathway guidance for WHO Prequalification, SFDA, NMPA, and EMA. Compliance documentation generated automatically.',
                color: '#1D9E75',
              },
            ].map((pillar, i) => (
              <div key={i} style={{
                padding: 32,
                borderRadius: 16,
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
                opacity: whySection.inView ? 1 : 0,
                transform: whySection.inView ? 'translateY(0)' : 'translateY(20px)',
                transition: `all 0.5s ease ${i * 0.1}s`,
              }}>
                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: `${pillar.color}12`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 20,
                }}>
                  {pillar.icon}
                </div>
                <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 20, color: '#0F172A', marginBottom: 8 }}>
                  {pillar.title}
                </h3>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#64748B', lineHeight: 1.7 }}>
                  {pillar.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" ref={howSection.ref} style={{ padding: '100px 32px', background: '#F8FAFC' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <h2 style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: 'clamp(28px, 4vw, 40px)',
              fontWeight: 400,
              color: '#0F172A',
              marginBottom: 8,
            }}>
              How It Works
            </h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: '#64748B' }}>
              From discovery to delivery in 4 steps
            </p>
          </div>

          <div style={{ position: 'relative' }}>
            {/* Connecting line */}
            <div className="mk-connect-line" style={{
              position: 'absolute',
              top: 32,
              left: '12.5%',
              right: '12.5%',
              height: 2,
              background: 'linear-gradient(90deg, #E2E8F0, #1D9E75, #1D9E75, #E2E8F0)',
              zIndex: 0,
            }} />

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 24,
              position: 'relative',
              zIndex: 1,
            }}>
              {[
                { step: '1', title: 'Search Products', desc: 'Browse quality-scored products from verified Pakistani manufacturers. Filter by drug, dosage form, or certification.' },
                { step: '2', title: 'Request Quote', desc: 'Submit an RFQ with your volume, destination, and timeline. Multiple manufacturers respond competitively.' },
                { step: '3', title: 'Negotiate Terms', desc: 'Compare offers side by side. Review CQS scores, certifications, and compliance documents.' },
                { step: '4', title: 'Secure Transaction', desc: 'Escrow-protected payment with quality-gated milestones. Full shipment tracking included.' },
              ].map((item, i) => (
                <div key={i} style={{
                  textAlign: 'center',
                  opacity: howSection.inView ? 1 : 0,
                  transform: howSection.inView ? 'translateY(0)' : 'translateY(20px)',
                  transition: `all 0.5s ease ${i * 0.12}s`,
                }}>
                  <div style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: '#0F172A',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: "'Instrument Serif', serif",
                    fontSize: 28,
                    margin: '0 auto 20px',
                    boxShadow: '0 4px 20px rgba(15,23,42,0.2)',
                  }}>
                    {item.step}
                  </div>
                  <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 18, color: '#0F172A', marginBottom: 8 }}>
                    {item.title}
                  </h3>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#64748B', lineHeight: 1.6 }}>
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== TOP MANUFACTURERS ===== */}
      <section style={{ padding: '80px 32px', background: '#FFFFFF' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: 'clamp(28px, 4vw, 40px)',
              fontWeight: 400,
              color: '#0F172A',
              marginBottom: 8,
            }}>
              Top Manufacturers
            </h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: '#64748B' }}>
              PMX-verified pharmaceutical exporters from Pakistan
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 20,
          }}>
            {topManufacturers.map((mfr, i) => (
              <Link
                key={mfr.id}
                href={`/marketplace/seller/${mfr.id}`}
                style={{ textDecoration: 'none', opacity: 0, animation: `staggerReveal 0.5s ease forwards`, animationDelay: `${i * 0.1}s` }}
              >
                <div style={{
                  padding: 28,
                  border: '1px solid #E2E8F0',
                  borderRadius: 16,
                  background: '#FFFFFF',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  {/* CQS Ring */}
                  <div style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    margin: '0 auto 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}>
                    <svg width="72" height="72" viewBox="0 0 72 72" style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
                      <circle cx="36" cy="36" r="32" fill="none" stroke="#F1F5F9" strokeWidth="4" />
                      <circle cx="36" cy="36" r="32" fill="none" stroke={getCqsColor(mfr.cqsBadge)} strokeWidth="4"
                        strokeDasharray={`${(mfr.cqs / 100) * 201} 201`}
                        strokeLinecap="round" style={{ transition: 'stroke-dasharray 1s ease' }} />
                    </svg>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 18, fontWeight: 700, color: getCqsColor(mfr.cqsBadge) }}>
                      {mfr.cqs > 0 ? mfr.cqs : '--'}
                    </span>
                  </div>

                  <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 18, color: '#0F172A', marginBottom: 4 }}>
                    {mfr.name}
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#94A3B8', marginBottom: 12 }}>
                    {mfr.city} &bull; {mfr.tier}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                    {mfr.pmxCertified && (
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: 100,
                        fontSize: 11,
                        fontWeight: 600,
                        fontFamily: "'DM Sans', sans-serif",
                        background: 'rgba(29,158,117,0.1)',
                        color: '#1D9E75',
                      }}>
                        PMX-Certified
                      </span>
                    )}
                    {mfr.certifications.slice(0, 2).map(cert => (
                      <span key={cert} style={{
                        padding: '3px 10px',
                        borderRadius: 100,
                        fontSize: 11,
                        fontWeight: 600,
                        fontFamily: "'DM Sans', sans-serif",
                        background: '#F1F5F9',
                        color: '#64748B',
                      }}>
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA BANNER ===== */}
      <section style={{
        padding: '80px 32px',
        background: '#0F172A',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Subtle glow */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at center, rgba(29,158,117,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <h2 style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: 'clamp(28px, 4vw, 42px)',
            fontWeight: 400,
            color: '#FFFFFF',
            marginBottom: 16,
            lineHeight: 1.2,
          }}>
            Ready to source pharmaceutical products?
          </h2>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 16,
            color: '#94A3B8',
            marginBottom: 36,
            lineHeight: 1.7,
          }}>
            Register as a buyer to access competitive pricing, quality-scored suppliers, and escrow-protected transactions.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/" style={{
              padding: '16px 36px',
              fontSize: 15,
              fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
              color: '#0F172A',
              background: '#fff',
              borderRadius: 12,
              textDecoration: 'none',
              transition: 'all 0.2s ease',
            }}>
              Register as Buyer
            </Link>
            <Link href="/marketplace/search?q=" style={{
              padding: '16px 36px',
              fontSize: 15,
              fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
              color: '#fff',
              background: 'transparent',
              borderRadius: 12,
              textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.2)',
              transition: 'all 0.2s ease',
            }}>
              Browse Products
            </Link>
          </div>
        </div>
      </section>

      <style jsx global>{`
        @media (max-width: 900px) {
          .mk-connect-line {
            display: none !important;
          }
        }
        @media (max-width: 900px) {
          section [style*="grid-template-columns: repeat(4"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 600px) {
          section [style*="grid-template-columns: repeat(4"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

// ===== PRODUCT CARD =====
function ProductCard({ product, index }: { product: typeof products[0]; index: number }) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 16,
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        opacity: 0,
        animation: `staggerReveal 0.5s ease forwards`,
        animationDelay: `${index * 0.06}s`,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.08)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Image area */}
      <div style={{
        height: 140,
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
        {/* Cert badges top-left */}
        <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 4 }}>
          {product.certifications.slice(0, 2).map(cert => (
            <span key={cert} style={{
              padding: '3px 8px',
              borderRadius: 6,
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
        {/* CQS badge top-right */}
        <div style={{
          position: 'absolute',
          top: 12,
          right: 12,
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: getCqsBg(product.cqsBadge),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 12,
          fontWeight: 700,
          color: getCqsColor(product.cqsBadge),
        }}>
          {product.cqs > 0 ? product.cqs : '--'}
        </div>
      </div>

      <div style={{ padding: '18px 20px 20px' }}>
        {/* Drug name */}
        <Link href={`/marketplace/product/${product.id}`} style={{ textDecoration: 'none' }}>
          <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 17, color: '#0F172A', marginBottom: 2, lineHeight: 1.3 }}>
            {product.inn} {product.strength}
          </div>
        </Link>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#94A3B8', marginBottom: 8 }}>
          {product.dosageForm} &bull; {product.brandName}
        </div>

        {/* Manufacturer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <Link href={`/marketplace/seller/${product.manufacturerId}`} style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            color: '#1D9E75',
            fontWeight: 600,
            textDecoration: 'none',
          }}>
            {product.manufacturerName}
          </Link>
          {product.pmxCertified && (
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#1D9E75', display: 'inline-block' }} />
          )}
        </div>

        <div style={{ height: 1, background: '#E2E8F0', marginBottom: 12 }} />

        {/* Price */}
        <div style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 14,
          fontWeight: 700,
          color: '#1D9E75',
          marginBottom: 4,
        }}>
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
          transition: 'all 0.2s ease',
        }}>
          Request Quote
        </Link>
      </div>
    </div>
  );
}
