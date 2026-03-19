# MyMedicalCabinet PWA — Claude Code Instructions

## Project Overview
MyMedicalCabinet is a patient-controlled health records PWA. Users store, track, and share medical records, medications, appointments, insurance, and bills. Integrates with Epic MyChart via SMART on FHIR for clinical data sync. AI-powered document analysis via Anthropic Claude API. Payment processing via Stripe Connect.

## Rules
- Always use **unique className IDs** across all components — no collisions.
- **Record all edits** in `editsummary.txt` at the project root after every change session.
- Act as a **MERN developer** with UX/UI skills.
- Prefer editing existing files over creating new ones.
- Use `React.lazy()` for modal imports to avoid circular dependencies.
- Never use `acorn --jsx` for syntax checking React files — use brace/paren balance check. Use `node -c` for server-side .js files.

## Tech Stack
- **Frontend**: React 18 (Create React App), React Router v6
- **Backend**: Node.js 18+, Express
- **Database**: MongoDB Atlas (Mongoose ODM)
- **Auth**: JWT (Bearer token) — `protect` middleware in `server/middleware/auth.js`
- **File Storage**: AWS S3
- **Email**: SendGrid
- **AI**: Anthropic Claude API (`claude-sonnet-4-20250514`)
- **Payments**: Stripe Connect (Express accounts for billers, 10% platform fee)
- **FHIR**: Epic SMART on FHIR R4 (patient-facing read scopes)
- **External APIs**: CMS Medicare rates, FDA (openFDA), RxNav (NLM), NPI Registry

## Commands
```bash
# Server
cd server && npm start           # Production
cd server && npm run dev         # Development (nodemon)
node -c server/routes/foo.js     # Syntax check server files

# Client
cd client && npm start           # Development
cd client && npm run build       # Production build

# Scripts
node server/scripts/seedHealthSystems.js  # Seed Epic health systems
```

## Project Structure
```
server/
  server.js              # Express app entry, middleware, route mounting
  middleware/
    auth.js               # protect(), authorize(), generateToken()
    familyMemberScope.js  # getFamilyMemberFilter() — validates ownership
    adminAuth.js          # Admin JWT validation
  models/                 # Mongoose schemas (14 models)
  routes/                 # Express routers (20+ route files)
  services/               # Business logic (Claude AI, FHIR mapping, Stripe, email, etc.)
  scripts/                # One-off scripts (seed, migration, inspection)
  emailTemplates/         # SendGrid HTML templates

client/
  public/                 # Static HTML pages (home, about, investors, etc.)
  src/
    pages/                # Route-level page components
    components/           # Shared UI components (~53 components)
    services/             # API service modules (~25 services)
    context/              # React context providers
```

## Key Architecture Patterns

### Family Members
- Family members are **lightweight FamilyMember docs** scoped to a user — NOT separate User accounts.
- `familyMemberId` field on all data models: `null` = primary user's data, set = family member's data.
- Frontend services accept optional `familyMemberId` as last param.
- Backend routes read `familyMemberId` from `req.query` (GET) or `req.body` (POST/PUT).
- `FamilyMemberContext` provides `activeMemberId` persisted in localStorage as `activeFamilyMemberId`.

### Doctor Model Exception
- Doctor model uses `patientId` (not `userId`) for the patient's doctor entries.
- All other models use `userId`.

### API Route Pattern
All routes follow: `/api/{resource}` with `protect` middleware for authenticated endpoints.

### AI Analysis Save Pattern
- AI results save to document subdocuments (`aiExplanation` field).
- Frontend checks for saved results before calling AI API (saves credits).
- Inline results display below documents in event details and upload components.

### Share Records Pattern
- Email-OTP and QR code access patterns.
- `ShareAccess` model with access codes, OTP hashing, session tokens.

## API Routes
| Base Path | Route File | Purpose |
|-----------|-----------|---------|
| `/api/auth` | `auth.js` | Register, login, verify email, password reset |
| `/api/users` | `users.js` | User profile management |
| `/api/medical-history` | `medicalHistory.js` | Medical records CRUD |
| `/api/medications` | `medications.js` | Medication records |
| `/api/doctors` | `doctors.js` | Doctor profiles |
| `/api/appointments` | `appointments.js` | Appointments, calendar sync, completion |
| `/api/insurance` | `insurance.js` | Insurance cards and policies |
| `/api/documents` | `documents.js` | S3 document upload/download |
| `/api/medical-bills` | `medicalBills.js` | Bills, payment intents |
| `/api/settlement-offers` | `settlementOffers.js` | Settlement negotiation |
| `/api/share` | `share.js` | Record sharing (OTP, QR) |
| `/api/family-members` | `familyMembers.js` | Family member CRUD |
| `/api/epic` | `epic.js` | Epic FHIR OAuth, sync, status |
| `/api/health-systems` | `healthSystems.js` | Health system search/lookup |
| `/api/ai` | `ai.js` | AI document analysis, save results |
| `/api/npi` | `npi.js` | NPI doctor lookup |
| `/api/reminders` | `reminders.js` | Appointment/medication reminders |
| `/api/investor-gate` | `investorGate.js` | Investor portal passcode |
| `/api/stripe/webhook` | `stripeWebhook.js` | Stripe payment webhooks |
| `/api/admin/*` | `admin*.routes.js` | Admin panel (auth, users, stats, management) |

## MongoDB Models
| Model | File | Key Fields |
|-------|------|-----------|
| User | `User.js` | email, password, role, consent |
| Doctor | `Doctor.js` | `patientId` (not userId), name, specialty |
| Appointment | `Appointment.js` | dateTime, doctorId, status, calendarSynced, visitSummary |
| Medication | `Medication.js` | name, dosage, frequency, status |
| MedicalHistory | `MedicalHistory.js` | conditions, allergies, surgeries, events (with documents[].aiExplanation) |
| Insurance | `Insurance.js` | provider, memberId, coverage, documents[].aiExplanation |
| MedicalBill | `MedicalBill.js` | biller, lineItems, totals, aiAnalysis, payments[], dispute |
| SettlementOffer | `SettlementOffer.js` | billId, offerAmount, status, billerStripeAccountId |
| FamilyMember | `FamilyMember.js` | userId, firstName, lastName, relationship |
| ShareAccess | `ShareAccess.js` | patientId, recipientEmail, accessCode, otpHash, accessLog |
| EpicConnection | `EpicConnection.js` | userId, healthSystemId, accessToken, patientFhirId |
| HealthSystem | `HealthSystem.js` | name, authorizeUrl, tokenUrl, fhirBaseUrl |
| Admin | `Admin.js` | email, password, permissions |
| NdaAgreement | `NdaAgreement.js` | name, email, agreedAt |

## Frontend Pages
| Route | Component | Auth Required |
|-------|-----------|--------------|
| `/login` | Login | No |
| `/verify-email` | VerifyEmail | No |
| `/reset-password` | ResetPassword | No |
| `/dashboard` | MyDashboard | Yes |
| `/medications` | MyMedications | Yes |
| `/doctors` | MyDoctors | Yes |
| `/medical-records` | MyMedicalRecords | Yes |
| `/insurance` | MyInsurance | Yes |
| `/appointments` | MyAppointments | Yes |
| `/medical-bills` | MyMedicalBills | Yes |
| `/intake-form` | IntakeForm | Yes |
| `/settings` | Settings | Yes |
| `/shared-records/:accessCode` | SharedRecords | No (OTP verified) |
| `/settlement/:accessCode` | BillerSettlement | No (session verified) |
| `/admin/*` | Admin pages | Admin JWT |

## Rate Limits
- General: 100 req / 15 min
- Auth (login/register): 10 req / 15 min
- OTP verification: 10 req / 15 min
- AI explanations: 10 req / 1 hour
- Share creation: 5 req / 15 min

## Security
- Helmet CSP configured (Google Analytics, Stripe, Google Maps, Epic FHIR allowed)
- MongoDB sanitization (express-mongo-sanitize)
- HPP (HTTP parameter pollution protection)
- CORS enabled
- JWT tokens in Authorization Bearer header
- OTPs bcrypt-hashed, locked after 5 failed attempts

## Deployment
- **Hosting**: Render (auto-deploys from `master` branch)
- **Database**: MongoDB Atlas
- **Static Assets/Logos/Icons**: AWS S3 (`s3://mymedicalcabinet/`)
- **Domain**: mymedicalcabinet.com
- **CDN/Proxy**: Cloudflare

## Cron Jobs
- Reminder processing: Every 15 minutes
- Settlement offer expiration: Daily at midnight

## Key External Integrations
- **Epic FHIR**: 493 health systems activated for production. OAuth flow uses per-health-system endpoints from HealthSystem collection. Sandbox fallback at `fhir.epic.com/interconnect-fhir-oauth`.
- **Stripe Connect**: Billers onboard via Express accounts. Platform takes configurable fee (default 10%). Webhook handles payment_intent.succeeded/failed.
- **CMS Medicare**: Free public API for fair price lookup by CPT code and state. No API key needed. Used in AI bill analysis.
- **SendGrid**: Transactional emails (verification, password reset, share invitations, settlement notifications, investor passcode).
