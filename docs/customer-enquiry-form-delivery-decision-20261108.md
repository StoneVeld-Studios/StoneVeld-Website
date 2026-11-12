# StoneVeld customer enquiry form: free-delivery decision

**Researched:** 8 November 2026  
**Repository:** StoneVeld-Studios/StoneVeld-Website  
**Status:** Research/design only; **no live form or mail service activated**. This document is not a legal compliance certification.

## Goal and constraints

Add an accessible enquiry form to the existing **Start Here** page without requiring the visitor to open an email client or create an account. Deliver a message to the existing StoneVeld business inbox, with no new monthly subscription and as little personal-data handling as possible. Keep the current, tested email and copy-address fallback active. Do not affect Contingency or the public website until tests and approvals are complete.

## What we verified

- Website source is static HTML/CSS/JS, with existing `mailto:` and a working copy-address fallback.
- HTTP responses identify Cloudflare at the edge, but **the connected Cloudflare account, Pages project, Workers plan, Email Service bindings, and DNS ownership have not been inspected**. Cloudflare headers alone do not prove Pages hosting.
- Current official Cloudflare documentation (15 October 2026) says sending **only to verified destination addresses** is free on Workers Free; arbitrary-recipient sending requires Workers Paid.
- Cloudflare Pages Functions count toward the Workers Free quota (100,000 requests/day across Workers + Pages Functions). A Cloudflare Static Forms plugin intercepts submissions but **does not by itself deliver email**; developer processing is required.
- Cloudflare Turnstile Free is available and requires **server-side Siteverify token validation**, not just a client widget.
- Google Workspace already handles StoneVeld email. **Cloudflare Email Routing cannot coexist with Google Workspace root-domain MX records.** Do not enable Routing or replace root MX records while setting up form notifications.
- Cloudflare **Email Sending** onboarding may change DNS on a `cf-bounce` subdomain, SPF/DKIM/DMARC configuration, and verified recipient settings. Inspect changes carefully before accepting. Free verified-destination sending must be confirmed in the actual account.
- Google Forms supports response notifications and can serve as a no-new-subscription fallback, but uses a Google-hosted interaction and needs responder visibility/privacy settings checked.
- Formspree Free offers 50 submissions/month and email notifications; Resend Free lists 3,000 outgoing emails/month, 100/day. Both add a data processor/account, so neither is the first choice.

## Preferred architecture: conditional

**Only if StoneVeld is already deployed with Cloudflare Pages and the Free verified-recipient binding is usable:**

`Visitor → Start Here native HTML form → Cloudflare Pages Function (/api/enquiry) → server-side Turnstile Siteverify → strict validation + rate controls → single, fixed verified destination → Google Workspace inbox → human reply`

No browser-submitted "to" or "from" headers. The real sender must be an approved/verified sender domain. Visitor email is untrusted input, potentially used as a validated `Reply-To` only if accepted by the sending API. Handle email and any line breaks safely; prefer plain text and do not render visitor-controlled HTML.

**Important:** This is a design **candidate**. Do not assume the Cloudflare Email Service binding works on the current account until confirmed by a verified staging send and delivered test inbox message. A successful API response is not proof of delivery.

### Required fields (minimal)

- Name, max 100 characters, required.
- Reply email, max 254 characters, required.
- Service category: website / creative / technical / other, required and validated against server allowlist.
- Brief message, max 2,000 characters, required.

No telephone, physical address, financial information, file upload, customer account, payments or marketing opt-in in version one. Display a short security note not to submit passwords or secrets. Preserve the current wording until the owner reviews revised enquiry text.

### Safety controls

1. Cloudflare Turnstile secret validated **on the server**, reject reused/expired/invalid tokens; account for accessibility and no-JavaScript fallback using existing email link.
2. Request method/Content-Type allowlist, reject excess body size, cap field lengths, email validation, reject unknown fields and line-break injection. Optionally honeypot, but never rely on it alone.
3. Throttle submissions by client/network with a privacy-aware mechanism. Confirm Cloudflare WAF/rate-limit capability in the actual free plan; document any per-IP false positives. The endpoint must fail closed when delivery binding or captcha secret is unavailable.
4. No credentials in GitHub, HTML, browser JS, logs, analytics or error pages. Use deployment secrets/bindings.
5. Fix the recipient in server configuration and restrict the Email Service binding to that single verified destination when available. Never expose a free relay endpoint.
6. Avoid raw content in error logs and email addresses in URL parameters. Use limited retention by policy in Google Workspace and any providers; no automatic claim that emails are instantly deleted.
7. A success message must mean the backend accepted and handed off the submission, not that inbox delivery is guaranteed. For provider failure, tell the visitor to use the existing email fallback, without falsely claiming a submission.
8. Preserve a no-JavaScript/keyboard-accessible alternate contact path and monitor abuse, bounce, retry and quota conditions.

## POPIA, operations and acceptance gates

**Before taking the form live:**

- Confirm the responsible party and its public contact details, Information Officer registration status, privacy requests route, retention approach and actual service providers. Draft a **POPIA section 18 collection notice** describing data collected, purpose, voluntary/necessary nature, recipients, possible cross-border transfers and data-subject rights. Obtain legal review where appropriate. The notice must describe **actual**, not hoped-for, processing. POPIA section 72 restricts some international transfers.
- Verify whether a processor agreement or international-transfer safeguard is needed for Cloudflare/Google and any alternatives. Note how encrypted transport, access control, retention and deletion are operated.
- Business enquiries do not constitute confirmed purchases, contracts or quotes. Before **online sales/payments**, separately assess ECTA section 43 supplier and consumer disclosures.
- Verify on desktop and actual mobile: screen-reader labels, WCAG 2.2 AA focus and error feedback, touch targets, response time, honeypot/Turnstile behavior, valid/invalid email, max-length, repeated submission, no JavaScript, no backend, rate limit and fallback.
- Run a **staging-only test** with a test message containing no real customer details. Verify receipt **inside** the destination inbox and human reply, including reply-to behavior, before enabling the form.
- Verify the website host really supports Cloudflare Pages Functions, the free binding exists, sender domain is onboarded without changing Google Workspace root MX, and the fixed destination is verified. Never accept unreviewed DNS changes.
- If any prerequisite fails, **keep the existing email buttons/copy fallback**. Do not publish an attractive but nonfunctional form.

## Fallback decision

1. **Preferred:** native form + Cloudflare Pages Functions + verified-recipient Email Service, *only after free-plan/account/DNS proof and delivery tests*.
2. **Simplest fully free alternative:** a Google Form with visitor access open, responder-entered email and notifications on. We would link it visibly from Start Here and test it on mobile. It is not integrated with our existing website styling, and provider/retention/privacy review remains necessary.
3. **Other fallbacks:** Formspree free (50 per month, 30-day archive), or Cloudflare Function + Resend Free (3,000 outgoing emails per month, 100/day) if the native Cloudflare notification path is unavailable and a third-party processor is acceptable. Costs/features can change.

## Next executable checkpoint

Check the actual StoneVeld Cloudflare dashboard **read-only**: Pages project exists and deploys this repo; Workers plan; Email Service sending/binding eligibility for a single verified inbox; Domain Sending onboarding prompt and proposed DNS records; Turnstile availability. Do **not** press an onboarding action that changes DNS or activates mail routing. Then implement the form with fake/staging credentials and automated tests in an **isolated branch**, keeping it unmerged until privacy, delivery and mobile checks pass.

## Primary current references (verified 2026-11-08)

- Cloudflare Email Service (verified-destination free allowance): https://developers.cloudflare.com/email-service/
- Send bindings and fixed destination: https://developers.cloudflare.com/email-service/configuration/send-bindings/
- Email sender DNS onboarding: https://developers.cloudflare.com/email-service/configuration/domains/
- Cloudflare vs Google Workspace MX conflict: https://developers.cloudflare.com/email-service/reference/troubleshooting/
- Cloudflare Pages Functions free requests: https://developers.cloudflare.com/pages/functions/pricing/
- Cloudflare Static Forms plugin (no automatic email): https://developers.cloudflare.com/pages/functions/plugins/static-forms/
- Cloudflare Turnstile mandatory server verification: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
- Google Forms notifications: https://support.google.com/docs/answer/139706
- Formspree free features: https://formspree.io/plans
- Resend free limits: https://resend.com/pricing
- South African POPIA Act (sections 18, 19, 21, 72): https://www.justice.gov.za/legislation/acts/2013-004.pdf
- Information Regulator official portal and Information Officer registration: https://eservices.inforegulator.org.za/
- WCAG 2.2: https://www.w3.org/TR/WCAG22/

**No live customer submissions, inbox/Cloudflare account changes, DNS updates, subscription purchases, website deployment or merges were performed in this phase.**
