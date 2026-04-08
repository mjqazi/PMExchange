'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface SearchQuery {
  query: string;
  count: number;
  last_searched: string;
}

interface ProductView {
  product: string;
  seller: string;
  views_7d: number;
  views_30d: number;
  total_views: number;
}

interface ArticlePerformance {
  title: string;
  views: number;
  avg_time_on_page: string;
  bounce_rate: string;
}

const DEMO_SEARCH_QUERIES: SearchQuery[] = [
  { query: 'paracetamol 500mg', count: 342, last_searched: '2026-04-05' },
  { query: 'amoxicillin', count: 287, last_searched: '2026-04-05' },
  { query: 'metformin', count: 231, last_searched: '2026-04-05' },
  { query: 'omeprazole capsules', count: 198, last_searched: '2026-04-04' },
  { query: 'ciprofloxacin 250mg', count: 176, last_searched: '2026-04-04' },
  { query: 'ibuprofen', count: 165, last_searched: '2026-04-05' },
  { query: 'amlodipine', count: 142, last_searched: '2026-04-04' },
  { query: 'losartan potassium', count: 128, last_searched: '2026-04-03' },
  { query: 'cephalexin', count: 112, last_searched: '2026-04-03' },
  { query: 'azithromycin', count: 98, last_searched: '2026-04-05' },
];

const DEMO_PRODUCT_VIEWS: ProductView[] = [
  { product: 'Paracetamol 500mg Tablets', seller: 'Lahore Generics Ltd.', views_7d: 523, views_30d: 1847, total_views: 4521 },
  { product: 'Amoxicillin 250mg Capsules', seller: 'Karachi PharmaCorp', views_7d: 412, views_30d: 1562, total_views: 3891 },
  { product: 'Metformin 500mg Tablets', seller: 'Lahore Generics Ltd.', views_7d: 389, views_30d: 1234, total_views: 3102 },
  { product: 'Omeprazole 20mg Capsules', seller: 'Multan MedGen Pvt. Ltd.', views_7d: 298, views_30d: 987, total_views: 2456 },
  { product: 'Ciprofloxacin 500mg Tablets', seller: 'Karachi PharmaCorp', views_7d: 245, views_30d: 876, total_views: 2100 },
  { product: 'Ibuprofen 400mg Tablets', seller: 'Lahore Generics Ltd.', views_7d: 201, views_30d: 754, total_views: 1832 },
  { product: 'Amlodipine 5mg Tablets', seller: 'Multan MedGen Pvt. Ltd.', views_7d: 187, views_30d: 623, total_views: 1567 },
  { product: 'Losartan 50mg Tablets', seller: 'Karachi PharmaCorp', views_7d: 165, views_30d: 541, total_views: 1234 },
];

const DEMO_ARTICLES: ArticlePerformance[] = [
  { title: 'PMX Launches Tier 3 Regulated Markets Track', views: 1247, avg_time_on_page: '4:32', bounce_rate: '23%' },
  { title: 'Understanding CQS: A Complete Guide', views: 892, avg_time_on_page: '6:15', bounce_rate: '18%' },
  { title: 'DRAP Compliance Updates for Q2 2026', views: 456, avg_time_on_page: '3:48', bounce_rate: '31%' },
  { title: 'How Karachi PharmaCorp Improved Their CQS', views: 321, avg_time_on_page: '5:02', bounce_rate: '25%' },
];

const searchTrendData = [
  { date: 'Mar 1', searches: 120 },
  { date: 'Mar 8', searches: 145 },
  { date: 'Mar 15', searches: 168 },
  { date: 'Mar 22', searches: 192 },
  { date: 'Mar 29', searches: 210 },
  { date: 'Apr 5', searches: 248 },
];

const pageViewsData = [
  { page: 'Homepage', views: 12400 },
  { page: 'Marketplace', views: 8900 },
  { page: 'Product Detail', views: 6700 },
  { page: 'Seller Profile', views: 3200 },
  { page: 'Blog', views: 2100 },
  { page: 'About', views: 980 },
];

const Badge = ({ children, type }: { children: React.ReactNode; type: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'teal' }) => {
  const styles: Record<string, { bg: string; color: string }> = {
    success: { bg: 'var(--pmx-green-light)', color: 'var(--pmx-green)' },
    warning: { bg: 'var(--pmx-amber-light)', color: 'var(--pmx-amber)' },
    danger: { bg: 'var(--pmx-red-light)', color: 'var(--pmx-red)' },
    info: { bg: 'var(--pmx-blue-light)', color: 'var(--pmx-blue)' },
    neutral: { bg: 'var(--pmx-gray-light)', color: 'var(--pmx-gray)' },
    teal: { bg: 'var(--pmx-teal-light)', color: 'var(--pmx-teal)' },
  };
  const s = styles[type];
  return (
    <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap', background: s.bg, color: s.color }}>
      {children}
    </span>
  );
};

const thStyle: React.CSSProperties = { textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--pmx-tx2)', padding: '0 8px 8px 0', borderBottom: '0.5px solid var(--border)', letterSpacing: '.03em', textTransform: 'uppercase' };
const tdStyle: React.CSSProperties = { padding: '9px 8px 9px 0', borderBottom: '0.5px solid var(--border)', verticalAlign: 'middle', fontSize: 12 };

export default function CMSAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [searchQueries, setSearchQueries] = useState<SearchQuery[]>(DEMO_SEARCH_QUERIES);
  const [productViews, setProductViews] = useState<ProductView[]>(DEMO_PRODUCT_VIEWS);
  const [articles, setArticles] = useState<ArticlePerformance[]>(DEMO_ARTICLES);

  useEffect(() => {
    Promise.all([
      fetch('/api/cms/analytics/searches').then(r => r.json()).then(d => { if (d.success) setSearchQueries(d.data); }).catch(() => {}),
      fetch('/api/cms/analytics/products').then(r => r.json()).then(d => { if (d.success) setProductViews(d.data); }).catch(() => {}),
      fetch('/api/cms/analytics/articles').then(r => r.json()).then(d => { if (d.success) setArticles(d.data); }).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const kpis = [
    { label: 'Total Searches (30d)', value: searchQueries.reduce((sum, q) => sum + q.count, 0).toLocaleString(), sub: '+12% vs last month', subColor: 'var(--pmx-green)' },
    { label: 'Product Page Views (30d)', value: productViews.reduce((sum, p) => sum + p.views_30d, 0).toLocaleString(), sub: '+8% vs last month', subColor: 'var(--pmx-green)' },
    { label: 'Blog Views (30d)', value: articles.reduce((sum, a) => sum + a.views, 0).toLocaleString(), sub: '+24% vs last month', subColor: 'var(--pmx-green)' },
    { label: 'Avg. Session Duration', value: '3:42', sub: '+0:18 vs last month', subColor: 'var(--pmx-green)' },
  ];

  if (loading) {
    return (
      <div style={{ padding: 20, minHeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--pmx-teal)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <div style={{ fontSize: 12, color: 'var(--pmx-tx2)' }}>Loading analytics...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 2 }}>CMS Analytics</h1>
          <p style={{ fontSize: 12, color: 'var(--pmx-tx2)' }}>Search trends, content performance, and product engagement</p>
        </div>
        <button style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 9px', borderRadius: 8, fontSize: 11, fontWeight: 500, cursor: 'pointer', border: '0.5px solid var(--input)', background: 'var(--pmx-bg)', color: 'var(--pmx-tx)', fontFamily: 'inherit' }}>
          Export Report
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10, marginBottom: 14 }}>
        {kpis.map(k => (
          <div key={k.label} style={{ background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 8, padding: 14 }}>
            <div style={{ fontSize: 11, color: 'var(--pmx-tx2)', marginBottom: 5 }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--pmx-tx)' }}>{k.value}</div>
            <div style={{ fontSize: 11, marginTop: 3, color: k.subColor }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 14, marginBottom: 14 }}>
        {/* Search Trends */}
        <div style={{ background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 12 }}>Search Volume Trend</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={searchTrendData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--pmx-tx2)' }} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--pmx-tx2)' }} />
              <Tooltip contentStyle={{ fontSize: 11, background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 6 }} />
              <Area type="monotone" dataKey="searches" stroke="#1D9E75" fill="#E1F5EE" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Page Views Distribution */}
        <div style={{ background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 12 }}>Page Views by Section</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={pageViewsData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--pmx-tx2)' }} />
              <YAxis dataKey="page" type="category" tick={{ fontSize: 10, fill: 'var(--pmx-tx2)' }} width={85} />
              <Tooltip contentStyle={{ fontSize: 11, background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 6 }} />
              <Bar dataKey="views" fill="#1D9E75" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tables Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 14, marginBottom: 14 }}>
        {/* Top Search Queries */}
        <div style={{ background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 12 }}>Top Search Queries</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['#', 'Query', 'Count', 'Last Searched'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {searchQueries.map((q, i) => (
                <tr key={q.query}>
                  <td style={tdStyle}><span style={{ color: 'var(--pmx-tx3)' }}>{i + 1}</span></td>
                  <td style={tdStyle}>
                    <strong style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}>{q.query}</strong>
                  </td>
                  <td style={tdStyle}>
                    <Badge type={i < 3 ? 'teal' : 'neutral'}>{q.count.toLocaleString()}</Badge>
                  </td>
                  <td style={tdStyle}><span style={{ color: 'var(--pmx-tx2)' }}>{q.last_searched}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Content Performance */}
        <div style={{ background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 12 }}>Content Performance (Articles)</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Article', 'Views', 'Avg. Time', 'Bounce'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {articles.map(a => (
                <tr key={a.title}>
                  <td style={{ ...tdStyle, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}><strong>{a.title}</strong></td>
                  <td style={tdStyle}>{a.views.toLocaleString()}</td>
                  <td style={tdStyle}><Badge type="info">{a.avg_time_on_page}</Badge></td>
                  <td style={tdStyle}>
                    <Badge type={parseInt(a.bounce_rate) < 25 ? 'success' : parseInt(a.bounce_rate) < 35 ? 'warning' : 'danger'}>
                      {a.bounce_rate}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Most Viewed Products */}
      <div style={{ background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 12 }}>Most Viewed Products</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['#', 'Product', 'Seller', '7d Views', '30d Views', 'Total Views'].map(h => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {productViews.map((p, i) => (
              <tr key={p.product}>
                <td style={tdStyle}><span style={{ color: 'var(--pmx-tx3)' }}>{i + 1}</span></td>
                <td style={tdStyle}><strong>{p.product}</strong></td>
                <td style={tdStyle}><span style={{ color: 'var(--pmx-tx2)' }}>{p.seller}</span></td>
                <td style={tdStyle}>{p.views_7d.toLocaleString()}</td>
                <td style={tdStyle}>{p.views_30d.toLocaleString()}</td>
                <td style={tdStyle}><Badge type="teal">{p.total_views.toLocaleString()}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
