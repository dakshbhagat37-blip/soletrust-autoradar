import test from "node:test";
import assert from "node:assert/strict";

import { dbStore } from "../server/db/store.ts";
import {
  getOrCreateClientRelationship,
  logOmnichannelInteraction,
  calculateRelationshipHealth,
} from "../features/relations/unified-inbox.ts";
import {
  spawnProjectFromDeal,
  logProjectTime,
  updateDeliverableStatus,
  calculateProjectProfitability,
  getTeamCapacityMetrics,
} from "../features/operations/project-spawner.ts";
import {
  createInvoiceFromMilestone,
  recordInvoicePayment,
  generatePrintableInvoiceHtml,
  SAC_CODES,
} from "../features/finance/invoice-engine.ts";
import {
  recordExpense,
  parseBankStatementCsv,
  getFinancialHealthMetrics,
} from "../features/finance/ledger-engine.ts";
import {
  queryExecutiveCopilot,
  checkAutonomousBusinessTriggers,
} from "../lib/ai/executive-copilot.ts";
import { generateContractAgreement } from "../lib/closing/contract-generator.ts";


test.beforeEach(() => {
  dbStore.__resetForTests();
});

test("Phase 15.1 — Unified Relationship CRM & Health Score Engine", () => {
  // 1. Create client relationship
  const client = getOrCreateClientRelationship({
    companyName: "Lumina Skin Clinics Pty Ltd",
    primaryContactName: "Dr. Elena Vance",
    primaryContactEmail: "elena@luminaskin.com.au",
    city: "Melbourne",
    country: "Australia",
    industry: "Dermatology",
  });

  assert.ok(client.id);
  assert.equal(client.companyName, "Lumina Skin Clinics Pty Ltd");
  assert.ok(client.portalToken.startsWith("portal_"));

  // 2. Log multichannel touchpoints
  logOmnichannelInteraction({
    clientId: client.id,
    channel: "email",
    direction: "outbound",
    subject: "Implementation Roadmap & Brand Kit",
    content: "Hi Elena, sending over the Phase 1 architectural deliverables for your review.",
    sender: "team@soletrust.ai",
    recipient: "elena@luminaskin.com.au",
  });

  logOmnichannelInteraction({
    clientId: client.id,
    channel: "whatsapp",
    direction: "inbound",
    content: "Thank you! Everything looks great, team approved the first deliverable.",
    sender: "+61412345678",
    recipient: "+919876543210",
    sentiment: "positive",
  });

  // 3. Compute Deterministic Health Score (0-100)
  const health = calculateRelationshipHealth(client.id);
  assert.ok(health.score >= 70, `Health score should be high for recent positive comms, got ${health.score}`);
  assert.equal(health.isGoingCold, false);
  assert.equal(health.status, "thriving");
  assert.ok(health.reasons.length >= 2);
});

test("Phase 15.2 — Contract-to-Delivery Operations: 1-Click Deal-to-Project Spawning", () => {
  const mockBusiness = {
    id: "biz-aus-001",
    canonicalName: "Aura Dental Care",
    city: "Sydney",
    country: "Australia",
    industry: "Healthcare",
    decisionMakers: [
      {
        fullName: "Dr. Marcus Brody",
        roleLabel: "Clinical Director",
        verificationStatus: "verified",
        email: "marcus@auradental.com.au",
      },
    ],
    status: "verified",
    contacts: [],
    sources: ["test"],
    qualificationScore: 88,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 1. Generate SOW Contract
  const contract = generateContractAgreement(mockBusiness, undefined, {
    providerName: "SoleTrust Studio Services",
    customTotalValue: "25000",
    governingLaw: "State of New South Wales, Australia",
  });

  assert.ok(contract.milestones.length >= 3);
  assert.ok(contract.agreementNumber.startsWith("SOW-"));

  // 2. Spawn Active Project from Deal Won
  const project = spawnProjectFromDeal({
    dealId: "deal-aura-001",
    contract,
    currency: "AUD",
  });

  assert.ok(project.id);
  assert.equal(project.status, "active");
  assert.equal(project.milestones.length, contract.milestones.length);
  assert.ok(project.totalContractValueCents > 0);
  assert.ok(project.milestones[0].deliverables.length > 0);
  assert.ok(project.milestones[0].tasks.length > 0);

  // 3. Log billable time
  const timeLog = logProjectTime({
    projectId: project.id,
    taskId: project.milestones[0].tasks[0].id,
    memberEmail: "dev@soletrust.ai",
    memberName: "Alex Mercer",
    hours: 8,
    hourlyRateCents: 6000, // $60/hr
    description: "Built automated booking engine integration",
  });

  assert.equal(timeLog.hours, 8);
  assert.equal(project.milestones[0].tasks[0].loggedHours, 8);

  // 4. Update deliverable review workflow: In Progress -> Client Review -> Approved
  const delivId = project.milestones[0].deliverables[0].id;
  updateDeliverableStatus(project.id, delivId, "client_review");
  assert.equal(dbStore.getProject(project.id)?.milestones[0].deliverables[0].status, "client_review");

  updateDeliverableStatus(project.id, delivId, "approved", {
    approvedBy: "Dr. Marcus Brody",
    feedback: "High quality output, authorized for milestone sign-off.",
  });

  const updatedProject = dbStore.getProject(project.id);
  assert.equal(updatedProject.milestones[0].deliverables[0].status, "approved");
  assert.ok(updatedProject.progressPercent > 0);

  // 5. Margin and Capacity calculation
  const margin = calculateProjectProfitability(project.id);
  assert.ok(margin.grossMarginPercent > 50, `Gross margin should exceed 50%, got ${margin.grossMarginPercent}%`);
  assert.equal(margin.isHealthyMargin, true);

  const capacity = getTeamCapacityMetrics();
  assert.ok(capacity.utilizationPercent > 0);
  assert.equal(capacity.isOverloaded, false);
});

test("Phase 15.3 — In-House Finance: Multi-Currency Milestone Invoicing with Strict Integer Tax", () => {
  const mockBusiness = {
    id: "biz-ind-001",
    canonicalName: "Apex Logistics India",
    city: "Mumbai",
    country: "India",
    industry: "Logistics",
    status: "verified",
    contacts: [],
    sources: ["test"],
    qualificationScore: 82,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const contract = generateContractAgreement(mockBusiness, undefined, {
    customTotalValue: "150000",
  });

  const project = spawnProjectFromDeal({
    dealId: "deal-apex-001",
    contract,
    currency: "INR",
  });

  const m1 = project.milestones[0];

  // 1. Create Milestone Invoice with Intra-State GST (9% CGST + 9% SGST)
  const invoiceIntra = createInvoiceFromMilestone({
    projectId: project.id,
    milestoneId: m1.id,
    taxType: "gst_intra",
  });

  assert.ok(invoiceIntra.id);
  assert.equal(invoiceIntra.currency, "INR");
  assert.equal(invoiceIntra.taxType, "gst_intra");
  assert.equal(invoiceIntra.items[0].hsnSacCode, SAC_CODES.SOFTWARE_DEVELOPMENT);

  // Check strict integer-paise math (zero float drift)
  const subtotal = invoiceIntra.subtotalCents;
  const expectedCgst = Math.round(subtotal * 0.09);
  const expectedSgst = Math.round(subtotal * 0.09);
  assert.equal(invoiceIntra.taxBreakdown.cgstCents, expectedCgst);
  assert.equal(invoiceIntra.taxBreakdown.sgstCents, expectedSgst);
  assert.equal(invoiceIntra.grandTotalCents, subtotal + expectedCgst + expectedSgst);
  assert.equal(invoiceIntra.status, "issued");

  // 2. Record Payment & Double-Entry Ledger Verification
  const paidInvoice = recordInvoicePayment({
    invoiceId: invoiceIntra.id,
    amountCents: invoiceIntra.grandTotalCents,
    paymentReference: "NEFT-HDFC-99882233",
  });

  assert.equal(paidInvoice.status, "paid");
  assert.equal(paidInvoice.balanceDueCents, 0);

  // Verify double-entry ledger entry was created
  const ledger = dbStore.getLedgerEntries();
  const paymentEntry = ledger.find((l) => l.referenceId === invoiceIntra.id);
  assert.ok(paymentEntry);
  assert.equal(paymentEntry.debitAccount, "Assets:OperatingAccount");
  assert.equal(paymentEntry.creditAccount, "Receivables:ClientInvoices");
  assert.equal(paymentEntry.amountCents, invoiceIntra.grandTotalCents);

  // 3. Print-Ready HTML Document Generation
  const html = generatePrintableInvoiceHtml(paidInvoice);
  assert.ok(html.includes("INVOICE"));
  assert.ok(html.includes(paidInvoice.invoiceNumber));
  assert.ok(html.includes("Apex Logistics India"));
  assert.ok(html.includes("SAC"));
});

test("Phase 15.4 — Double-Entry Expense Ledger, Bank CSV Import & 90-Day Runway Forecasting", () => {
  // 1. Record business expenses
  recordExpense({
    category: "software",
    vendor: "Vercel Inc.",
    description: "Enterprise Edge Deployment Hosting",
    amountCents: 2000000, // ₹20,000 / $200
    currency: "INR",
  });

  recordExpense({
    category: "payroll",
    vendor: "Lead Solutions Architect",
    description: "Monthly core engineering salary",
    amountCents: 15000000, // ₹1,50,000
    currency: "INR",
  });

  // 2. Bank CSV Statement Import & Auto-Categorization
  const sampleCsv = `Date,Description,Amount
2026-11-01,AWS Cloud Infrastructure Services,-145.50
2026-11-03,Google Workspace Enterprise,-36.00
2026-11-05,Client Direct Wire Deposit,2500.00
2026-11-10,Upwork Global Freelancer,-450.00`;

  const parsedRows = parseBankStatementCsv(sampleCsv);
  assert.equal(parsedRows.length, 4);
  assert.equal(parsedRows[0].suggestedCategory, "infrastructure");
  assert.equal(parsedRows[1].suggestedCategory, "software");
  assert.equal(parsedRows[2].suggestedCategory, "client_payment");
  assert.equal(parsedRows[3].suggestedCategory, "contractors");

  // 3. 90-Day Cash Flow Runway Computation
  const fin = getFinancialHealthMetrics([
    { dealValueCents: 5000000, stage: "contract_sent" },
    { dealValueCents: 3000000, stage: "proposal_sent" },
  ]);

  assert.ok(fin.ninetyDayRunway.currentCashCents > 0);
  assert.ok(fin.ninetyDayRunway.projectedInflowCents > 0);
  assert.ok(fin.ninetyDayRunway.projectedOutflowCents > 0);
  assert.ok(fin.ninetyDayRunway.estimatedMonthsRunway > 0);
  assert.equal(fin.ninetyDayRunway.confidenceScore, 0.91);
});

test("Phase 15.5 — Executive AI COO & CFO Copilot: Live Cross-Module Queries & Triggers", async () => {
  // Seed an overdue invoice to test detection
  const client = getOrCreateClientRelationship({
    companyName: "Zenith Digital",
    primaryContactName: "Sarah Connor",
    primaryContactEmail: "sarah@zenith.com",
    city: "London",
    country: "UK",
  });

  dbStore.saveInvoice({
    id: "inv-overdue-test",
    invoiceNumber: "INV-2026-9999",
    clientId: client.id,
    clientLegalName: client.companyName,
    clientBillingAddress: "London, UK",
    providerName: "SoleTrust AI",
    providerAddress: "Global Services",
    providerTaxId: "GB123456789",
    providerAuthorizedSignatory: "Managing Partner",
    issueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(), // 16 days overdue!
    currency: "GBP",
    items: [
      {
        id: "item-1",
        description: "SEO Strategy Phase",
        quantity: 1,
        unitPriceCents: 350000,
        totalCents: 350000,
      },
    ],
    subtotalCents: 350000,
    taxType: "vat",
    taxRatePercent: 20,
    taxBreakdown: { vatCents: 70000 },
    totalTaxCents: 70000,
    grandTotalCents: 420000,
    amountPaidCents: 0,
    balanceDueCents: 420000,
    status: "overdue",
    paymentTerms: "Net 14",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // 1. Natural Language Query: Overdue Invoices
  const qOverdue = await queryExecutiveCopilot("Which clients have overdue invoices over 15 days?");
  assert.equal(qOverdue.category, "finance");
  assert.ok(qOverdue.dataPoints.length >= 1);
  assert.ok(qOverdue.summary.includes("overdue invoice"));
  assert.ok(qOverdue.actionItems.length >= 1);

  // 2. Natural Language Query: 90-Day Runway & MRR
  const qRunway = await queryExecutiveCopilot("What is our 90-day cash runway and projected MRR?");
  assert.equal(qRunway.category, "finance");
  assert.ok(qRunway.keyMetrics.currentCash);
  assert.ok(qRunway.keyMetrics.estimatedMonthsRunway);

  // 3. Natural Language Query: Project Profitability & Gross Margin
  const qProfit = await queryExecutiveCopilot("What is our net profit margin on D2C projects this quarter?");
  assert.equal(qProfit.category, "finance");
  assert.ok(qProfit.keyMetrics.overallNetMargin);

  // 4. Autonomous Business Health Trigger Scanner
  const alerts = checkAutonomousBusinessTriggers();
  assert.ok(alerts.length >= 1);
  const overdueAlert = alerts.find((a) => a.category === "cash_collection");
  assert.ok(overdueAlert, "Should trigger a cash collection alert for the 16-day overdue invoice");
  assert.equal(overdueAlert?.severity, "critical");
});

test("Phase 15.6 — Complete Business OS Life-Cycle End-to-End Integration", () => {
  // Step 1: Discovered Lead with Verified Owner
  const leadBusiness = {
    id: "e2e-biz-101",
    canonicalName: "Nexus Clean Energy",
    city: "Brisbane",
    country: "Australia",
    industry: "Solar Energy",
    decisionMakers: [
      {
        fullName: "Samantha Hayes",
        roleLabel: "Founder & Chief Executive",
        email: "samantha@nexusenergy.com.au",
        phone: "+61730001122",
        verificationStatus: "verified",
      },
    ],
    status: "verified",
    contacts: [],
    sources: ["nominatim", "searxng"],
    qualificationScore: 92,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Step 2: Commercial SOW Contract Agreement
  const contract = generateContractAgreement(leadBusiness, undefined, {
    customTotalValue: "50000",
    governingLaw: "State of Queensland, Australia",
  });

  // Step 3: Deal Won -> Auto-Project Spawn
  const project = spawnProjectFromDeal({
    dealId: "deal-nexus-101",
    contract,
    currency: "AUD",
  });

  assert.equal(project.status, "active");
  assert.equal(project.milestones.length, contract.milestones.length);

  // Step 4: Deliverable Review & Approval
  const m1 = project.milestones[0];
  const d1 = m1.deliverables[0];
  updateDeliverableStatus(project.id, d1.id, "approved", {
    approvedBy: "Samantha Hayes",
  });

  // Step 5: Issue Milestone 1 Invoice
  const invoice = createInvoiceFromMilestone({
    projectId: project.id,
    milestoneId: m1.id,
    taxType: "vat",
  });

  assert.equal(invoice.status, "issued");
  assert.equal(invoice.currency, "AUD");

  // Step 6: Settle Payment & Update Ledger
  const settledInvoice = recordInvoicePayment({
    invoiceId: invoice.id,
    amountCents: invoice.grandTotalCents,
    paymentReference: "DIRECT-DEBIT-COMMBANK-4411",
  });

  assert.equal(settledInvoice.status, "paid");

  // Step 7: Verify P&L and 90-Day Runway
  const fin = getFinancialHealthMetrics();
  assert.ok(fin.totalRevenueCents >= invoice.grandTotalCents);
  assert.ok(fin.ninetyDayRunway.estimatedMonthsRunway > 0);
});
