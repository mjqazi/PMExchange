# PMX Pharma Exchange — TODO Register

## Urgent / Next Steps

- [ ] **Register in Google Search Console** — go to https://search.google.com/search-console, add `pmexchange.pk`, verify via DNS TXT record, then submit sitemap at `https://pmexchange.pk/sitemap.xml`
- [ ] **Register in Bing Webmaster Tools** — https://www.bing.com/webmasters
- [ ] **Set up Google Analytics** — add GA4 tracking tag to root layout
- [ ] **Set up Google Verification** — replace `GOOGLE_VERIFICATION_CODE_HERE` in `src/app/layout.tsx` with actual code from Search Console

## Features to Build

- [ ] Buyer registration flow (public sign-up from marketplace)
- [ ] Seller registration / onboarding from marketplace
- [ ] Email notifications (integrate Resend or SMTP)
- [ ] Password reset flow
- [ ] Real file upload for media library and documents
- [ ] WhatsApp share for products
- [ ] PDF invoice/contract generation improvements
- [ ] Multi-language support (Arabic, Chinese for key markets)
- [ ] Payment gateway integration (beyond PSO escrow mock)
- [ ] Real-time chat between buyer and seller

## Infrastructure

- [ ] Set up a proper domain email (info@pmexchange.pk)
- [ ] Configure Cloudflare CDN for assets
- [ ] Set up automated database backups (pg_dump cron)
- [ ] Configure monitoring/alerting (uptime checks)
- [ ] Separate staging environment with its own database
- [ ] CI/CD pipeline (GitHub Actions for build + deploy)

## SEO / Marketing

- [ ] Submit sitemap to Google Search Console
- [ ] Submit sitemap to Bing Webmaster Tools
- [ ] Create Google Business Profile for PMX
- [ ] Write 5-10 blog articles targeting pharma export keywords
- [ ] Build backlinks from PPMA, DRAP, TDAP directories
- [ ] Set up social media profiles (LinkedIn, Twitter) and add to Organization schema sameAs

## Quality / Testing

- [ ] Add form-submission E2E tests (batch creation, RFQ posting, negotiations)
- [ ] Load testing (simulate 50+ concurrent users)
- [ ] Accessibility audit (WCAG AA compliance)
- [ ] Mobile responsiveness polish (test on real devices)
- [ ] Browser compatibility testing (Chrome, Firefox, Safari, Edge)

## Technical Debt

- [ ] Replace hardcoded marketplace product data with database-driven catalog
- [ ] Connect marketplace search to real product database
- [ ] Implement proper image storage (S3/MinIO instead of Unsplash hotlinks)
- [ ] Add rate limiting to API routes
- [ ] Implement proper refresh token rotation
- [ ] Add WebSocket for real-time notifications

---

*Last updated: 2026-04-09*
