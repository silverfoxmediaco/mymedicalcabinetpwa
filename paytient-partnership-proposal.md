# MyMedicalCabinet x Paytient --- Integration & Partnership Proposal

## Who We Are

MyMedicalCabinet is a patient-controlled health records PWA where users store, manage, and share medical records, medications, appointments, insurance, and bills. We integrate with 493+ Epic MyChart health systems via SMART on FHIR, and offer AI-powered document analysis and medical bill negotiation with direct payment processing via Stripe.

## The Opportunity

Our platform includes a **medical bill negotiation and settlement tool** --- patients upload bills, our AI analyzes them for errors and fair pricing (using CMS Medicare rates and CPT code validation), and patients submit settlement offers directly to billers. Once an offer is accepted, the patient pays through our platform via Stripe.

**This is the exact moment where Paytient adds massive value.** A patient has just negotiated their bill down and is ready to pay. Instead of absorbing that cost all at once, Paytient-enrolled members see the option to pay with their Paytient card --- turning a lump-sum settlement into a 0% interest repayment plan of up to 12 months.

## How It Works Technically

- The Paytient Visa card processes through our existing Stripe payment infrastructure --- no custom payment gateway or API integration required.
- Paytient-enrolled members see Paytient branding and messaging at the payment step, encouraging use of their HPA benefit.
- The biller gets paid in full immediately (via Stripe destination charge to their connected account). The patient repays Paytient over time. MyMedicalCabinet collects a platform fee. Everyone wins.

## Integration Touchpoints

| Touchpoint | Description |
|------------|-------------|
| **Settlement Payment** | After a negotiated offer is accepted, enrolled members see "Pay with Paytient" messaging alongside the payment form |
| **Direct Bill Payment** | For bills with a connected biller, enrolled members see the same Paytient option |
| **Member Enrollment** | Users self-declare Paytient enrollment in their profile settings |
| **Logo & Branding** | Paytient logo displayed at enrollment and payment touchpoints |

## Why This Partnership Makes Sense

### For Paytient

- **High-intent payment moments** --- these aren't browsing users, they're patients actively paying a negotiated medical bill
- **Increased card utilization** --- every settlement payment is a potential Paytient transaction
- **Distribution to individual patients** --- MyMedicalCabinet reaches patients directly, complementing Paytient's employer channel
- **Co-branded value story for employers** --- "your employees can negotiate AND finance their medical bills"
- **Complete PHR platform for members** --- Paytient members gain access to a full personal health record system including:
  - Medical records management with Epic MyChart integration across 493+ health systems
  - Medication tracking with refill reminders
  - Doctor directory with NPI-verified provider lookup
  - Appointment scheduling with calendar sync and visit summaries
  - Insurance card storage and policy management
  - Family member management --- track records for dependents and caregivers in one account
  - Secure record sharing with doctors and caregivers via email OTP or QR code
  - AI-powered document analysis --- patients upload medical documents and get plain-language explanations
  - AI bill analysis with CPT code validation, CMS Medicare fair-price comparison, and error detection
- **Smarter healthcare consumers** --- members who understand their bills, track their records, and catch billing errors cost less to support and are more engaged with their benefits
- **Employer retention differentiator** --- a Paytient HPA bundled with a full PHR platform is a fundamentally stronger employee benefit than a payment card alone

### For MyMedicalCabinet

- **Access to 23M+ Paytient members** as potential platform users
- **Higher payment conversion** --- patients more likely to complete payment when they can spread cost over 12 months at 0% interest
- **Employer channel distribution** --- Paytient's 6,000+ employer plans become a B2B acquisition path
- **Enhanced value proposition** --- bill negotiation + AI analysis + interest-free financing is a complete medical bill solution

## Technical Architecture (Already Built)

The integration is live and ready for demo:

**Backend:**
- User model includes `paytient.enrolled` and `paytient.enrolledAt` fields
- Profile update API accepts Paytient enrollment toggle
- No changes to Stripe payment processing --- Paytient Visa processes like any other card

**Frontend:**
- Settings page: Paytient enrollment section with logo, description, and toggle switch
- Bill Negotiation Tab: Paytient banner appears above "Pay Now" button for enrolled users
- Payment Form: Paytient reminder with logo appears above Stripe card entry for enrolled users
- All components use unique CSS class prefixes to avoid collisions

## Proposed Next Steps

1. **Demo walkthrough** --- live demo of the settlement flow with Paytient branding
2. **Logo and brand usage approval** --- formal authorization for in-app Paytient branding
3. **Pilot integration** with a subset of Paytient employer plans
4. **Co-marketing** to Paytient members ("Manage and negotiate your medical bills")
5. **Explore white-label or co-branded employer offering**
6. **Evaluate data-sharing opportunities** (e.g., Paytient transaction data to automatic bill tracking in MyMedicalCabinet)

---

**Contact:** MyMedicalCabinet | mymedicalcabinet.com
