# 🔐 SECURITY DEPLOYMENT CHECKLIST

## ✅ COMPLETED (Automated)

### Database Security
- [x] RLS policies hardened (no more `WITH CHECK (true)`)
- [x] Function `search_path` vulnerabilities fixed
- [x] Rate limiting implemented (10 reservations/hour per user)
- [x] Hold manipulation prevention
- [x] Audit logging enabled
- [x] Admin-only policies for sensitive operations

### API Security
- [x] Input validation and sanitization
- [x] Security headers (CSP, HSTS, XSS protection)
- [x] Rate limiting middleware (100 requests/minute per IP)
- [x] Error handling without sensitive info exposure

### Code Security
- [x] XSS prevention
- [x] SQL injection prevention (Supabase parameterized queries)
- [x] CSRF protection (Next.js built-in)
- [x] Environment variables properly configured

### Documentation
- [x] Security audit report created
- [x] Security configuration guide created
- [x] Incident response plan documented
- [x] .gitignore properly configured

---

## ⚠️ MANUAL ACTIONS REQUIRED

### 1. Enable Leaked Password Protection (CRITICAL)
**Priority:** HIGH  
**Time:** 2 minutes

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `eplpppndxyjsszrulfzb`
3. Navigate to: **Authentication** → **Settings**
4. Scroll to **Password Security**
5. Enable: **"Check passwords against HaveIBeenPwned database"**
6. Click **Save**

**Why:** Prevents users from using compromised passwords that have appeared in data breaches.

---

### 2. Review and Configure Auth Settings
**Priority:** HIGH  
**Time:** 5 minutes

In Supabase Dashboard → Authentication → Settings:

- [x] **Email confirmation required** (should already be enabled)
- [ ] **Password strength requirements**
  - Minimum length: 8 characters
  - Require uppercase: ✓
  - Require lowercase: ✓
  - Require numbers: ✓
  - Require special characters: ✓
- [ ] **Session timeout**
  - Recommended: 1 week (604800 seconds)
- [ ] **Refresh token rotation**
  - Enable: ✓

---

### 3. Set Up Monitoring (Recommended)
**Priority:** MEDIUM  
**Time:** 15 minutes

#### Supabase Monitoring
1. Go to **Database** → **Logs**
2. Set up alerts for:
   - Failed authentication attempts (> 10 in 5 minutes)
   - Rate limit violations
   - Unusual database activity

#### Application Monitoring
1. Consider integrating:
   - **Sentry** for error tracking
   - **LogRocket** for session replay
   - **Datadog** for infrastructure monitoring

---

### 4. Environment Variables Security
**Priority:** HIGH  
**Time:** 10 minutes

#### For Vercel Deployment:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add all variables from `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` ⚠️ Mark as **Sensitive**
   - `NEXT_PUBLIC_SITE_URL`

3. **IMPORTANT:** Mark `SUPABASE_SERVICE_ROLE_KEY` as "Sensitive"
4. Limit access to production environment variables

#### Verify:
- [ ] No `.env` files committed to Git
- [ ] Production uses different Supabase project than development
- [ ] Service role key is marked as sensitive in Vercel

---

### 5. SSL/HTTPS Configuration
**Priority:** HIGH  
**Time:** Automatic (Vercel)

- [x] Vercel automatically provides SSL certificates
- [ ] Verify HTTPS is enforced (should be automatic)
- [ ] Test: Visit `http://your-domain.com` → should redirect to `https://`

---

### 6. Domain Configuration (If Custom Domain)
**Priority:** MEDIUM  
**Time:** 10 minutes

If using a custom domain:

1. Add domain in Vercel Dashboard
2. Configure DNS records as instructed
3. Wait for SSL certificate provisioning
4. Update `NEXT_PUBLIC_SITE_URL` in environment variables
5. Update Supabase Auth redirect URLs:
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Add: `https://your-domain.com/auth/callback`

---

### 7. Final Security Verification
**Priority:** HIGH  
**Time:** 10 minutes

Run these tests before going live:

#### Test Authentication
- [ ] Register new user → Should require email confirmation
- [ ] Try weak password → Should be rejected
- [ ] Try leaked password → Should be rejected (after enabling protection)
- [ ] Login with wrong password 5 times → Should be rate limited

#### Test Authorization
- [ ] Regular user tries to access admin panel → Should be denied
- [ ] User tries to view another user's reservations → Should be denied
- [ ] User tries to modify another user's reservation → Should be denied

#### Test Rate Limiting
- [ ] Make 100+ requests in 1 minute → Should get 429 error
- [ ] Create 10+ reservations in 1 hour → Should get rate limit error

#### Test Input Validation
- [ ] Try SQL injection in customer note → Should be sanitized
- [ ] Try XSS in customer note → Should be sanitized
- [ ] Try invalid date format → Should get 400 error
- [ ] Try negative duration → Should get 400 error

---

### 8. Backup and Recovery
**Priority:** MEDIUM  
**Time:** 15 minutes

#### Database Backups
1. Go to Supabase Dashboard → Database → Backups
2. Verify automatic backups are enabled
3. Test restore procedure (on staging environment)

#### Environment Variables Backup
1. Export all environment variables to a secure location
2. Store encrypted backup (use password manager or vault)
3. Document who has access

---

### 9. Team Security Training
**Priority:** MEDIUM  
**Time:** 30 minutes

Ensure all team members understand:

- [ ] Never commit `.env` files
- [ ] Never expose service role key
- [ ] How to rotate keys if compromised
- [ ] How to review audit logs
- [ ] Incident response procedures

---

### 10. Compliance (If Applicable)
**Priority:** Varies  
**Time:** Varies

#### GDPR (If serving EU users)
- [ ] Implement data export functionality
- [ ] Implement data deletion workflow
- [ ] Create privacy policy
- [ ] Add cookie consent banner
- [ ] Document data retention policy

#### PCI DSS (Payment processing)
- [x] No credit card data stored (using Yappy)
- [x] Secure transmission (HTTPS)
- [x] Access control implemented

---

## 🚀 DEPLOYMENT CHECKLIST

Before deploying to production:

- [ ] All manual actions above completed
- [ ] Build passes: `npm run build`
- [ ] All tests pass (if you have tests)
- [ ] Security verification tests completed
- [ ] Team trained on security procedures
- [ ] Monitoring and alerts configured
- [ ] Backup procedures tested
- [ ] Incident response plan reviewed

---

## 📞 POST-DEPLOYMENT

### First 24 Hours
- [ ] Monitor error logs closely
- [ ] Check for unusual authentication patterns
- [ ] Verify rate limiting is working
- [ ] Test all critical user flows

### First Week
- [ ] Review audit logs daily
- [ ] Monitor performance metrics
- [ ] Collect user feedback
- [ ] Address any security concerns immediately

### Ongoing
- [ ] Review security logs weekly
- [ ] Update dependencies monthly (`npm audit`)
- [ ] Rotate keys every 90 days
- [ ] Security audit every 6 months

---

## 🆘 EMERGENCY CONTACTS

**Security Incident:** [Your security team email]  
**Supabase Support:** https://supabase.com/support  
**Vercel Support:** https://vercel.com/support

---

## ✅ SIGN-OFF

**Deployed by:** ___________________  
**Date:** ___________________  
**Verified by:** ___________________  
**Production URL:** ___________________

---

**Last Updated:** 2026-01-27  
**Next Review:** 2026-04-27
