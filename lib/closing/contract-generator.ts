import type { Business } from "../types/business.ts";
import type { CrmLead } from "../types/lead.ts";
import { DEFAULT_STUDIO_SETTINGS } from "../dispatch/types.ts";
import { getStudioSettings } from "../dispatch/settings-store.ts";

export interface ContractDetails {
  agreementNumber: string;
  effectiveDate: string;
  providerName: string;
  providerEmail: string;
  taxId?: string;
  authorizedSignatory?: string;
  clientLegalName: string;
  clientAddress: string;
  clientSignerName: string;
  clientSignerRole: string;
  scopeOfWork: string[];
  milestones: Array<{
    phase: string;
    description: string;
    deliverable: string;
    estimatedWeeks: number;
    paymentAmount: string;
  }>;
  totalAgreementValue: string;
  paymentTerms: string;
  governingLaw: string;
  markdownDocument: string;
  htmlDocument: string;
}

/**
 * In-House Statement of Work (SOW) & Legal Agreement Generator
 * Produces an enforceable commercial service agreement with pre-filled verified prospect credentials.
 */
export function generateContractAgreement(
  business: Business,
  lead?: CrmLead,
  options: {
    providerName?: string;
    providerEmail?: string;
    customTotalValue?: string;
    governingLaw?: string;
    paymentTerms?: string;
    taxId?: string;
    governingLawJurisdiction?: string;
    authorizedSignatory?: string;
  } = {}
): ContractDetails {
  const companyName = business.canonicalName || "Client Entity";
  const address = business.address || `${business.city || "Commercial District"}, ${business.country || "Global"}`;
  const agreementNumber = `SOW-${Date.now().toString().slice(-6)}-${(business.city || "AR").slice(0, 3).toUpperCase()}`;
  const effectiveDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const primaryDm = business.decisionMakers?.find(
    (d) => d.verificationStatus === "verified" || d.verificationStatus === "partially_verified"
  ) || business.decisionMakers?.[0];

  const signerName = primaryDm?.fullName || (primaryDm as unknown as { name?: string })?.name || lead?.primaryDecisionMakerName || "Authorized Representative";
  const signerRole = primaryDm?.roleLabel || (primaryDm as unknown as { role?: string })?.role || lead?.primaryDecisionMakerRole || "Managing Director / Officer";

  const studioSettings = getStudioSettings();
  const providerName = options.providerName || studioSettings.studioName || DEFAULT_STUDIO_SETTINGS.studioName;
  const providerEmail = options.providerEmail || studioSettings.contactEmail || DEFAULT_STUDIO_SETTINGS.contactEmail;
  const taxId = options.taxId || studioSettings.taxId || DEFAULT_STUDIO_SETTINGS.taxId || "N/A (Sole Proprietorship / Corporate)";
  const authorizedSignatory = options.authorizedSignatory || studioSettings.authorizedSignatory || DEFAULT_STUDIO_SETTINGS.authorizedSignatory || "Authorized Partner";
  const governingLaw = options.governingLawJurisdiction || options.governingLaw || studioSettings.governingLawJurisdiction || studioSettings.governingJurisdiction || business.country || DEFAULT_STUDIO_SETTINGS.governingJurisdiction;
  const paymentTerms = options.paymentTerms || studioSettings.paymentTerms || DEFAULT_STUDIO_SETTINGS.paymentTerms;

  const industry = (business.industry || "").toLowerCase();
  const isDtc = /d2c|dtc|d to c|ecommerce|e-commerce|consumer brand/i.test(industry);
  const isSupermarketRetail = !isDtc && /supermarket|grocery|retail|food|f&b|market/i.test(industry);

  let totalAgreementValue = options.customTotalValue || "$12,500 USD";
  let scopeOfWork: string[] = [];
  let milestones = [];

  if (isSupermarketRetail) {
    totalAgreementValue = options.customTotalValue || "$7,500 USD (Initial Distribution Allocation)";
    scopeOfWork = [
      `Exclusive Wholesale Direct-Store-Delivery (DSD) shelf placement at ${companyName}`,
      "Guaranteed weekly stock replenishment and zero-out-of-stock cooler management",
      "Point-of-sale visual endcap merchandising fixtures and promotional collateral",
      "Guaranteed 32% minimum retail gross margin rate schedule",
    ];
    milestones = [
      {
        phase: "Phase 1: Product Onboarding & Compliance",
        description: "SKU setup, barcode registry verification, and store buyer walkthrough",
        deliverable: "Authorized Vendor Onboarding Packet & Approved Order Guide",
        estimatedWeeks: 1,
        paymentAmount: "$2,500 USD",
      },
      {
        phase: "Phase 2: Initial Delivery & Merchandising",
        description: "Direct-store delivery of opening product inventory & endcap installation",
        deliverable: "Signed Bill of Lading & Merchandised Display Verification",
        estimatedWeeks: 2,
        paymentAmount: "$3,000 USD",
      },
      {
        phase: "Phase 3: Restock & Promotional Review",
        description: "30-day velocity assessment and automated EDI reorder configuration",
        deliverable: "Sell-Through Performance Report & Recurring Replenishment Protocol",
        estimatedWeeks: 4,
        paymentAmount: "$2,000 USD",
      },
    ];
  } else if (isDtc) {
    totalAgreementValue = options.customTotalValue || "$18,500 USD";
    scopeOfWork = [
      `High-Conversion Mobile Flagship Storefront Redesign for ${companyName}`,
      "Sub-second Core Web Vitals optimization slashing mobile checkout latency",
      "Custom interactive 3D product visualizer & editorial visual storytelling components",
      "Integrated analytics, customer attribution, and single-click checkout flow",
    ];
    milestones = [
      {
        phase: "Phase 1: Architecture Blueprint & UX Teardown",
        description: "Technical audit, user flow mapping, and clickable Figma/UI prototype",
        deliverable: "Approved Design System & Technical Specification Document",
        estimatedWeeks: 1,
        paymentAmount: "$6,500 USD",
      },
      {
        phase: "Phase 2: Frontend Engineering & Performance Build",
        description: "Headless / Shopify Plus theme development with sub-second page performance",
        deliverable: "Staging Storefront Preview & Core Web Vitals Audit Report",
        estimatedWeeks: 3,
        paymentAmount: "$7,000 USD",
      },
      {
        phase: "Phase 3: QA, Launch & Conversion Tuning",
        description: "Cross-device validation, end-to-end checkout test orders, and production cutover",
        deliverable: "Live Storefront Deployment & 30-Day Performance Guarantee",
        estimatedWeeks: 4,
        paymentAmount: "$5,000 USD",
      },
    ];
  } else {
    totalAgreementValue = options.customTotalValue || "$12,500 USD";
    scopeOfWork = [
      `Turnkey 24/7 Inbound Client Intake & Conversion Engine for ${companyName}`,
      "Automated calendar booking and appointment qualification workflow",
      "Sub-second mobile landing interface with zero inquiry drop-off",
      "Multichannel WhatsApp & SMS confirmation pipeline",
    ];
    milestones = [
      {
        phase: "Phase 1: Discovery & Intake Architecture",
        description: "Client journey mapping and qualification logic blueprint",
        deliverable: "Intake Logic Blueprint & Calendar Integration Matrix",
        estimatedWeeks: 1,
        paymentAmount: "$4,500 USD",
      },
      {
        phase: "Phase 2: System Build & Automation Integration",
        description: "Deployment of custom intake engine and CRM notification triggers",
        deliverable: "Working Staging Intake System with SMS/WhatsApp Verification",
        estimatedWeeks: 2,
        paymentAmount: "$5,000 USD",
      },
      {
        phase: "Phase 3: Staff Handover & Production Go-Live",
        description: "Team briefing, operational playbook, and live domain cutover",
        deliverable: "Production Deployment & Operations Runbook",
        estimatedWeeks: 3,
        paymentAmount: "$3,000 USD",
      },
    ];
  }

  // Markdown Document
  const markdownDocument = `# STATEMENT OF WORK & COMMERCIAL SERVICE AGREEMENT
**Agreement Number:** ${agreementNumber}  
**Effective Date:** ${effectiveDate}  
**Governing Law:** Jurisdiction of ${governingLaw}

---

### PARTIES
1. **Service Provider:** ${providerName}
   - **Contact Email:** ${providerEmail}
   - **Tax ID / Business Registration:** ${taxId}
   - **Authorized Signatory:** ${authorizedSignatory}
2. **Client:** ${companyName}
   - **Registered Address:** ${address}
   - **Authorized Signer:** ${signerName}, ${signerRole}

---

### 1. SCOPE OF SERVICES
Service Provider agrees to deliver the following commercial scope for Client:
${scopeOfWork.map((s, idx) => `${idx + 1}. **${s}**`).join("\n")}

---

### 2. MILESTONES & COMMERCIAL COMPENSATION
Total Agreement Value: **${totalAgreementValue}**  
Payment Terms: ${paymentTerms}

| Milestone / Phase | Deliverable | Est. Timeline | Amount |
| :--- | :--- | :--- | :--- |
${milestones.map((m) => `| **${m.phase}** | ${m.deliverable} | ${m.estimatedWeeks} Wks | ${m.paymentAmount} |`).join("\n")}

---

### 3. INTELLECTUAL PROPERTY & OWNERSHIP
Upon receipt of full payment, all custom design files, code repositories, workflows, and deliverables developed specifically for Client shall be the exclusive property of Client. Provider retains rights to generic underlying developer utilities and pre-existing frameworks.

### 4. CONFIDENTIALITY & DATA SECURITY
Both parties agree to protect proprietary business data, customer records, and financial details with strict commercial discretion. Neither party shall disclose confidential information to any third party without prior written consent.

### 5. TERMINATION
Either party may terminate this Agreement with fourteen (14) days written notice. In the event of early termination, Client shall pay for all completed deliverables and verified milestone hours incurred up to the termination date.

---

### SIGNATURES & ACCEPTANCE

**For Service Provider:**  
Signature: _______________________  
Name: ${authorizedSignatory}  
Title: Authorized Partner / Signatory  
Date: ${effectiveDate}  

**For Client (${companyName}):**  
Signature: _______________________  
Name: ${signerName}  
Title: ${signerRole}  
Date: _______________________  
`;

  // Clean HTML Document for PDF Print
  const htmlDocument = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Service Agreement — ${companyName} (${agreementNumber})</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #111827; max-width: 820px; margin: 40px auto; padding: 0 24px; }
    h1 { font-size: 24px; border-bottom: 2px solid #06b6d4; padding-bottom: 8px; margin-bottom: 4px; }
    .meta { font-size: 13px; color: #4b5563; margin-bottom: 24px; }
    h2 { font-size: 16px; margin-top: 24px; margin-bottom: 8px; color: #1f2937; text-transform: uppercase; letter-spacing: 0.5px; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
    th, td { border: 1px solid #d1d5db; padding: 10px 12px; text-align: left; }
    th { background: #f3f4f6; font-weight: 600; }
    .signatures { display: flex; justify-content: space-between; margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e7eb; }
    .sig-block { width: 45%; font-size: 13px; }
    .sig-line { border-bottom: 1px solid #4b5563; height: 32px; margin-bottom: 6px; }
  </style>
</head>
<body>
  <h1>STATEMENT OF WORK & SERVICE AGREEMENT</h1>
  <div class="meta">
    <strong>Agreement:</strong> ${agreementNumber} | 
    <strong>Date:</strong> ${effectiveDate} | 
    <strong>Governing Law:</strong> ${governingLaw}
  </div>

  <h2>1. Parties</h2>
  <p><strong>Provider:</strong> ${providerName} (${providerEmail})<br>
  <strong>Tax ID / Registration:</strong> ${taxId}<br>
  <strong>Authorized Signatory:</strong> ${authorizedSignatory}<br>
  <strong>Client:</strong> ${companyName}, ${address} (Signer: ${signerName}, ${signerRole})</p>

  <h2>2. Scope of Services</h2>
  <ul>
    ${scopeOfWork.map((s) => `<li>${s}</li>`).join("")}
  </ul>

  <h2>3. Milestones & Compensation</h2>
  <p><strong>Total Value:</strong> ${totalAgreementValue} (${paymentTerms})</p>
  <table>
    <tr><th>Phase</th><th>Deliverable</th><th>Timeline</th><th>Amount</th></tr>
    ${milestones
      .map(
        (m) => `<tr><td><strong>${m.phase}</strong></td><td>${m.deliverable}</td><td>${m.estimatedWeeks} Wks</td><td>${m.paymentAmount}</td></tr>`
      )
      .join("")}
  </table>

  <h2>4. Key Legal Terms</h2>
  <p><strong>Intellectual Property:</strong> 100% transfer of custom work to Client upon receipt of milestone fees.<br>
  <strong>Confidentiality:</strong> Strict mutual non-disclosure of proprietary customer and commercial data.<br>
  <strong>Termination:</strong> 14-day written notice with pro-rata compensation for delivered work.</p>

  <div class="signatures">
    <div class="sig-block">
      <div class="sig-line"></div>
      <strong>${authorizedSignatory}</strong><br>
      Authorized Signatory, ${providerName}<br>
      Date: ${effectiveDate}
    </div>
    <div class="sig-block">
      <div class="sig-line"></div>
      <strong>${signerName}</strong><br>
      ${signerRole}, ${companyName}<br>
      Date: ________________________
    </div>
  </div>
</body>
</html>`;

  return {
    agreementNumber,
    effectiveDate,
    providerName,
    providerEmail,
    taxId,
    authorizedSignatory,
    clientLegalName: companyName,
    clientAddress: address,
    clientSignerName: signerName,
    clientSignerRole: signerRole,
    scopeOfWork,
    milestones,
    totalAgreementValue,
    paymentTerms,
    governingLaw,
    markdownDocument,
    htmlDocument,
  };
}
