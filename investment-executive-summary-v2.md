# MyMedicalCabinet, Inc.
## Executive Summary | $2.5M Seed Round

---

**CONFIDENTIAL MEMORANDUM**
**February 2026**

**Prepared for:** Legal Counsel, Board Members, Prospective Investors
**Distribution:** Restricted

---

## I. Company Overview

MyMedicalCabinet, Inc. ("the Company") is a healthcare technology company that has developed a fully functional Progressive Web Application (PWA) enabling consumers to store, manage, and instantly share their complete medical records with healthcare providers.

**Current Status:** The platform is not a prototype. It is a **production-ready MVP** with advanced technical capabilities deployed at mymedicalcabinet.com. Core features include:

- Prescription barcode scanning with NDC-to-drug-information lookup (OpenFDA)
- Insurance card OCR processing performed entirely client-side (Tesseract.js)
- Real-time drug interaction alerts (RxNav/NIH)
- Healthcare provider verification via NPI Registry (CMS)
- Automated medication, appointment, and refill reminders (SendGrid)
- Full account deletion with complete data purge (GDPR/CCPA compliant)

The Company is structured for institutional investment and is seeking a **$2.5M Seed Round** to fund an 18–24 month runway focused on infrastructure scale, clinical go-to-market execution, and regulatory hardening.

---

## II. The Power Triangle: Leadership Team

The founding team combines deep clinical domain expertise, enterprise financial architecture, and proven technical execution—a deliberate structure designed to accelerate hospital-grade partnerships and venture-scale growth.

---

### David Disbrow — Chief Executive Officer

**Background:** 30+ years in medical administration | Former Assistant Vice President, Mednax

David Disbrow is the Company's strategic and clinical anchor. His career at Mednax—a leading physician services organization operating across 400+ facilities—provides direct access to pediatric and neonatal practice networks, hospital system decision-makers, and payer relationships.

**Strategic Value:**
- Established relationships with pediatric practice administrators and clinical leadership
- Deep understanding of practice management workflows, reimbursement models, and compliance requirements
- Credibility to negotiate B2B distribution agreements with hospital systems and large medical groups

David's role is to position MyMedicalCabinet as a clinical-grade tool that meets the operational standards of institutional healthcare, not a consumer novelty.

---

### Patrick Morocco — Chief Financial Officer

**Background:** Business Solutions Architect, DXC Technology | Former Dell, Hewlett Packard Enterprise

Patrick Morocco brings enterprise-scale financial and systems architecture to the Company. His experience structuring complex pricing models, managing P&L for technology services, and designing scalable operational systems positions the Company to build sustainable unit economics from Day 1.

**Strategic Value:**
- Enterprise SaaS pricing architecture (per-member, per-practice, tiered models)
- Financial modeling for venture-scale growth and capital efficiency
- Operational systems design for multi-site clinical deployments
- Experience navigating Fortune 500 procurement and contract structures

Patrick's role is to ensure the Company operates with institutional-grade financial discipline and can articulate clear paths to profitability for investors and partners.

---

### James McEwen — Chief Technology Officer

**Background:** Full-Stack MERN Developer | Technical Founder

James McEwen designed, architected, and built the entire MyMedicalCabinet platform as a solo technical founder. The production system includes:

- 40+ React components across 14 pages
- 11 Express API route modules with 7 Mongoose data models
- Integrations with 7 external APIs (RxNav, OpenFDA, NPI Registry, Google Places, Google Calendar, SendGrid, AWS S3)
- Security infrastructure: AES-256 encryption at rest (MongoDB Atlas), JWT authentication, bcrypt password hashing, API rate limiting, HTTPS enforcement

**Technical Differentiators Built:**
- **Client-Side OCR:** Insurance card scanning processes images entirely on-device using Tesseract.js. Images never leave the user's phone—only extracted text is transmitted. This is a privacy-by-design architecture that reduces liability and regulatory exposure.
- **NPI Verification:** Real-time provider lookup against the CMS National Provider Identifier registry, enabling users to verify physician credentials before adding them to their records.
- **Full Data Deletion:** Users can permanently delete their account and all associated data (medications, doctors, appointments, insurance, medical history) with a single action—meeting GDPR and CCPA "right to erasure" requirements.

---

## III. Founder Commitment & Corporate Governance

The Company is structured to protect intellectual property, ensure long-term founder alignment, and meet institutional investment standards.

### Equity Vesting

All founders are subject to a **four-year vesting schedule with a one-year cliff**:

| Founder | Role | Vesting Period | Cliff |
|---------|------|----------------|-------|
| David Disbrow | CEO | 48 months | 12 months |
| Patrick Morocco | CFO | 48 months | 12 months |
| James McEwen | CTO | 48 months | 12 months |

Unvested shares are subject to repurchase by the Company at cost upon departure.

### Intellectual Property Assignment

All intellectual property—including source code, system architecture, trade secrets, and proprietary processes—is assigned to MyMedicalCabinet, Inc. The CTO has executed a formal IP Assignment Agreement covering all pre-incorporation contributions.

### Corporate Structure

- **Entity:** Delaware C-Corporation (or to be formed upon counsel advisement)
- **Authorized Shares:** Standard institutional structure with common/preferred classes
- **Board Composition:** Founders + independent seat(s) reserved for lead investor
- **Protective Provisions:** Standard seed-stage investor protections (anti-dilution, information rights, pro-rata)

---

## IV. Strategic Positioning: The Pediatric Caregiver Niche

### Market Entry Strategy

Rather than competing broadly in the crowded consumer health app market, MyMedicalCabinet is targeting a **high-value, underserved niche: parents and caregivers managing pediatric health records**.

**Why Pediatrics:**

1. **Fragmented Records:** Children see multiple providers (pediatrician, specialists, urgent care, school nurse) with no unified record system accessible to parents.

2. **High Motivation:** Parents are highly motivated users—especially for children with chronic conditions, allergies, or complex medication regimens.

3. **Caregiver Network Effect:** Pediatric care involves multiple decision-makers (parents, grandparents, school staff, babysitters) who need shared access to critical health information.

4. **David Disbrow's Network:** The CEO's Mednax relationships provide direct distribution to pediatric and neonatal practices nationwide.

### Privacy-by-Design as Competitive Moat

The Company's technical architecture provides **structural competitive advantages** that are difficult for competitors to replicate:

| Feature | Implementation | Competitive Advantage |
|---------|----------------|----------------------|
| Client-Side OCR | Tesseract.js processes insurance cards on-device | Images never reach servers—reduced breach liability, simplified compliance |
| Full Data Deletion | One-click account purge across all collections | GDPR/CCPA compliant by architecture, not policy |
| Encryption at Rest | MongoDB Atlas AES-256 | Enterprise-grade without enterprise cost |
| No Data Brokering | No third-party analytics or ad tracking | Trust positioning for health-conscious parents |

**This architecture is a financial asset:** Lower breach exposure reduces insurance costs, simplifies regulatory audits, and positions the Company favorably for enterprise contracts with health systems that mandate vendor security assessments.

---

## V. The Financial Ask

### Investment Terms

| Parameter | Terms |
|-----------|-------|
| **Round Size** | $2.5M |
| **Instrument** | Series Seed Preferred Equity or SAFE with valuation cap |
| **Pre-Money Valuation** | $12M–$15M |
| **Use of Proceeds** | 18–24 month runway |
| **Target Close** | Q2 2026 |

### Use of Funds

| Category | Allocation | Amount | Purpose |
|----------|------------|--------|---------|
| **Scale Infrastructure** | 40% | $1,000,000 | Engineering hires (security, mobile, backend), FHIR integration for EHR interoperability, Apple Health/Google Fit connectivity, infrastructure scaling |
| **GTM & Clinical Pilots** | 30% | $750,000 | 3–5 pediatric practice pilots via Mednax network, enterprise sales hire, partnership development, outcomes documentation, case studies |
| **Regulatory & Security Hardening** | 30% | $750,000 | SOC 2 Type II certification, HIPAA compliance audit, FTC Health Breach Rule readiness (2026 mandate), penetration testing, legal counsel |

### 2026 Regulatory Drivers

The timing of this raise is strategic. **2026 introduces significant regulatory changes** that will reshape the competitive landscape:

1. **FTC Health Breach Notification Rule (Effective 2026):** Health apps not covered by HIPAA now face federal breach notification requirements. This eliminates casual competitors and rewards companies with privacy-by-design architecture.

2. **CMS Interoperability Rules:** Payers and providers must support patient access APIs (FHIR). MyMedicalCabinet is positioned to be the consumer-facing tool that organizes this data.

3. **State Privacy Laws:** California (CCPA/CPRA), Virginia, Colorado, and other states are enforcing consumer data rights. The Company's full-deletion capability is already compliant.

**Companies without compliant infrastructure will face increasing legal exposure and will struggle to secure enterprise contracts. MyMedicalCabinet's architecture is built for this environment.**

---

## VI. Current Traction & Technical Milestones

| Capability | Status | Technical Detail |
|------------|--------|------------------|
| Production MVP | **LIVE** | Deployed at mymedicalcabinet.com |
| User Authentication | **LIVE** | JWT tokens, bcrypt hashing, email verification |
| Medication Management | **LIVE** | Barcode scanning, drug autocomplete, interaction alerts |
| Insurance Management | **LIVE** | Client-side OCR, 85+ provider autocomplete |
| Doctor Management | **LIVE** | NPI verification, Google Places integration |
| Appointment Management | **LIVE** | Google Calendar sync, automated reminders |
| Medical Records | **LIVE** | Conditions, allergies, surgeries, family history, document upload |
| Security Infrastructure | **LIVE** | AES-256 encryption, rate limiting, HTTPS |
| GDPR-Compliant Deletion | **LIVE** | Full data purge capability |
| Automated Reminders | **LIVE** | Medication, appointment, refill (15-min cron cycle) |

---

## VII. Summary

MyMedicalCabinet is not a concept—it is a **deployed, functional platform** built by a technical founder and backed by executives with direct clinical and enterprise experience. The Company is positioned to capture a high-value niche (pediatric caregivers) with a privacy-first architecture that provides structural regulatory and competitive advantages.

The $2.5M Seed Round will fund the infrastructure scale, clinical validation, and regulatory hardening required to transition from MVP to enterprise-ready platform within 18–24 months.

We invite interested parties to schedule a technical demonstration and detailed financial discussion.

---

## VIII. Contact Information

**MyMedicalCabinet, Inc.**

David Disbrow
Chief Executive Officer
[Email] | [Phone]

Patrick Morocco
Chief Financial Officer
[Email] | [Phone]

James McEwen
Chief Technology Officer
[Email] | [Phone]

---

*This memorandum contains confidential and proprietary information. It is intended solely for the use of the named recipients. Any distribution, reproduction, or disclosure without the express written consent of MyMedicalCabinet, Inc. is strictly prohibited.*

---

**Document Version:** 1.0
**Prepared By:** Office of the CTO
**Date:** February 2, 2026
