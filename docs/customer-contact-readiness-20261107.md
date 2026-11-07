# StoneVeld customer contact readiness

**Review date:** 7 November 2026
**Scope:** Public static website, enquiry-only phase.
**Status:** Technical improvement in preview; **not a legal-compliance certification**.

## Verified current facts

- The public Start Here page lists website, creative, technical and community paths.
- Enquiry actions currently open a pre-addressed email draft using `mailto:`. This is **not** a delivered enquiry or a hosted form.
- A visible, selectable email address plus progressive-enhancement Copy Email button provides a simple alternative for customers who use Gmail, Outlook or other browser-based mail. The clipboard action runs in the visitor's browser; **it does not send or store** an enquiry.
- Public website is served over HTTPS. The assistant's own `/assistant/*` headers differ from the public pages; this review does not assess a site-wide CSP.
- The sitemap was missing `/start-here`; the preview adds it.
- Our website displays the business trading name and public email. **Do not fabricate** a physical address, telephone number, VAT number or transaction terms.

## Standards and release gates

| Area | What to check before claiming compliance |
| --- | --- |
| South African POPIA, section 18 | When collecting names/emails/messages, publish verified responsible-party identification, the specific purpose, optional/mandatory status and relevant rights/recipient/transfer information **before collection**. Avoid promising retention or data handling we have not verified. |
| Personal information security | Enquiry records, if later collected, need limited authorized access, retention/deletion procedures, processor review and incident response; never put inbox contents or secrets in the public GitHub repo. |
| ECTA section 43 | Before **online sales or payment**, assess supplier's registration details, physical contact and legal-service address, price and taxes, terms, delivery, records, refunds/cancellation and privacy/security notices. Display only accurate details verified by company representatives. |
| Accessibility, WCAG 2.2 AA target | Provide keyboard-visible focus, readable controls, descriptive links and status messages. If a real form is added later, each input needs a visible label and clear errors. |
| Public form security (if later chosen) | Server-side validation, length limits, spam controls, abuse throttling, secret isolation, delivery verification, secure storage/retention and privacy/vendor review. Do not create a visually convincing form with no working backend. |
| Client workflow | An enquiry is not a binding quote or purchase. Respond with discovery, scope, written pricing/terms, approval and then a transaction. Confirm what is and is not included. |
| Operational acceptance | Verify live inbox receipt and reply using a dedicated test enquiry, check both mobile/desktop, non-JS fallback, main navigation and correct HTTPS URLs. Do not report inbox success until tested. |

## Product decision

**Now:** Retain the existing no-signup enquiry flow, add manual-webmail copy fallback, no new external vendor or cookies. Release only after visual and keyboard test.

**Later, requiring explicit service selection:** A genuinely hosted form can avoid email-app dependence, but it needs an endpoint and data processor. Options include a Cloudflare Pages Function/Static Forms plus selected storage/delivery, or a form-provider service. Verify provider terms, free quotas, data location, cross-border handling and abuse protections before connecting personal data. Cloudflare Pages Static Forms does not automatically send email without processing logic.

## Primary references

- POPIA section 18 guidance: https://www.dsti.gov.za/images/SECTION_18_CONSENT_FORM.pdf
- Information Regulator privacy notice (model of disclosure categories): https://inforegulator.org.za/privacy-notice/
- ECTA section 43: https://www.saflii.org/za/legis/consol_act/ecata2002427/
- W3C accessible form guidance: https://www.w3.org/WAI/tutorials/forms/
- W3C WCAG 2.2 labels: https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions
- OWASP bot/automation control guidance: https://cheatsheetseries.owasp.org/cheatsheets/Bot_Management_and_Anti-Automation_Cheat_Sheet.html
- Cloudflare Pages static forms: https://developers.cloudflare.com/pages/functions/plugins/static-forms/

**No third-party form, database, inbox integration or payment processor has been activated as part of this increment.**
