/**
 * SoleTrust Business OS v5.0 — Unified Database Schema
 * Defines the core persistent entities across Lead Intelligence, CRM Relations,
 * Project Operations, Invoicing & Financial Ledger.
 */

export type CurrencyCode = "INR" | "USD" | "AUD" | "EUR" | "GBP";

// ============================================================
// 1. RELATIONS & OMNICHANNEL CRM SCHEMA
// ============================================================

export type OmnichannelChannel =
  | "email"
  | "whatsapp"
  | "linkedin"
  | "instagram"
  | "call"
  | "portal"
  | "note";

export type MessageDirection = "inbound" | "outbound" | "system";
export type MessageSentiment = "positive" | "neutral" | "negative" | "urgent";

export interface OmnichannelInteraction {
  id: string;
  clientId: string;
  dealId?: string;
  channel: OmnichannelChannel;
  direction: MessageDirection;
  subject?: string;
  content: string;
  sender: string;
  recipient: string;
  sentiment: MessageSentiment;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface ClientRelationship {
  id: string;
  companyName: string;
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone?: string;
  website?: string;
  industry: string;
  city: string;
  country: string;
  dealId?: string;
  leadId?: string;
  portalToken: string;
  healthScore: number; // 0 - 100
  healthStatus: "thriving" | "healthy" | "at_risk" | "critical";
  lastTouchpointDate: string;
  openInvoiceCount: number;
  totalRevenueCents: number;
  activeProjectId?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// 2. OPERATIONS & PROJECT DELIVERY SCHEMA
// ============================================================

export type ProjectStatus = "active" | "in_review" | "completed" | "on_hold";
export type DeliverableStatus = "draft" | "in_progress" | "client_review" | "approved";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface ProjectTask {
  id: string;
  projectId: string;
  milestoneId: string;
  title: string;
  description?: string;
  assignedTo: string;
  estimatedHours: number;
  loggedHours: number;
  completed: boolean;
  priority: TaskPriority;
  dueDate: string;
  completedAt?: string;
}

export interface ProjectDeliverable {
  id: string;
  projectId: string;
  milestoneId: string;
  title: string;
  description: string;
  status: DeliverableStatus;
  artifactUrl?: string;
  approvedBy?: string;
  approvedAt?: string;
  clientFeedback?: string;
}

export interface ProjectMilestone {
  id: string;
  projectId: string;
  phaseNumber: number;
  title: string;
  description: string;
  allocatedValueCents: number;
  estimatedWeeks: number;
  startDate: string;
  targetDate: string;
  completedDate?: string;
  status: "pending" | "in_progress" | "completed";
  deliverables: ProjectDeliverable[];
  tasks: ProjectTask[];
  invoiced: boolean;
  invoiceId?: string;
}

export interface ProjectTimeLog {
  id: string;
  projectId: string;
  taskId: string;
  memberEmail: string;
  memberName: string;
  hours: number;
  hourlyRateCents: number;
  date: string;
  description: string;
  billable: boolean;
}

export interface ClientProject {
  id: string;
  dealId: string;
  clientId: string;
  clientLegalName: string;
  contractAgreementNumber: string;
  projectName: string;
  scopeSummary: string[];
  totalContractValueCents: number;
  currency: CurrencyCode;
  startDate: string;
  targetEndDate: string;
  status: ProjectStatus;
  progressPercent: number;
  milestones: ProjectMilestone[];
  timeLogs: ProjectTimeLog[];
  allocatedTeam: string[];
  portalToken: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// 3. FINANCE, INVOICING & LEDGER SCHEMA
// ============================================================

export type InvoiceStatus = "draft" | "issued" | "viewed" | "paid" | "overdue" | "cancelled";
export type TaxType = "gst_intra" | "gst_inter" | "vat" | "sales_tax" | "export_lut";

export interface InvoiceLineItem {
  id: string;
  description: string;
  hsnSacCode?: string; // e.g. SAC 998311 for IT consulting
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
}

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string; // e.g. INV-2026-001
  dealId?: string;
  projectId?: string;
  milestoneId?: string;
  clientId: string;
  clientLegalName: string;
  clientBillingAddress: string;
  clientTaxId?: string; // GSTIN, ABN, EIN, VAT
  providerName: string;
  providerAddress: string;
  providerTaxId: string;
  providerAuthorizedSignatory: string;
  issueDate: string;
  dueDate: string;
  currency: CurrencyCode;
  items: InvoiceLineItem[];
  subtotalCents: number;
  taxType: TaxType;
  taxRatePercent: number; // e.g. 18 for GST, 20 for VAT
  taxBreakdown: {
    cgstCents?: number; // 9%
    sgstCents?: number; // 9%
    igstCents?: number; // 18%
    vatCents?: number;
    salesTaxCents?: number;
  };
  totalTaxCents: number;
  grandTotalCents: number;
  amountPaidCents: number;
  balanceDueCents: number;
  status: InvoiceStatus;
  notes?: string;
  paymentTerms: string;
  viewedAt?: string;
  paidAt?: string;
  lastReminderSentAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type ExpenseCategory =
  | "payroll"
  | "contractors"
  | "software"
  | "marketing"
  | "infrastructure"
  | "office"
  | "legal"
  | "travel"
  | "other";

export interface ExpenseRecord {
  id: string;
  date: string;
  category: ExpenseCategory;
  vendor: string;
  description: string;
  amountCents: number;
  currency: CurrencyCode;
  projectId?: string; // Can be assigned directly to client project for COGS
  clientId?: string;
  isDeductible: boolean;
  receiptUrl?: string;
  createdAt: string;
}

export interface LedgerEntryRecord {
  id: string;
  date: string;
  referenceId: string; // invoiceId, expenseId, or paymentId
  description: string;
  debitAccount: string; // e.g. "Assets:Bank", "Expenses:Software"
  creditAccount: string; // e.g. "Revenue:ClientFees", "Liabilities:TaxPayable"
  amountCents: number;
  currency: CurrencyCode;
  createdAt: string;
}

// ============================================================
// 4. CLIENT PORTAL SCHEMA
// ============================================================

export interface ClientPortalSession {
  token: string;
  clientId: string;
  dealId: string;
  projectId?: string;
  clientName: string;
  contractSigned: boolean;
  contractSignedAt?: string;
  contractSignerName?: string;
  contractSignatureData?: string;
  createdDate: string;
  lastAccessedDate: string;
}

// ============================================================
// 5. COMBINED PERSISTENT STORE CONTAINER
// ============================================================

export interface BusinessOSData {
  clients: Record<string, ClientRelationship>;
  interactions: Record<string, OmnichannelInteraction[]>;
  projects: Record<string, ClientProject>;
  invoices: Record<string, InvoiceRecord>;
  expenses: Record<string, ExpenseRecord>;
  ledger: LedgerEntryRecord[];
  portals: Record<string, ClientPortalSession>;
}
