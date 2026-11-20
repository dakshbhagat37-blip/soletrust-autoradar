/**
 * SoleTrust Business OS v5.0 — Persistent Storage Engine
 * Manages atomic persistence for Relationships, Operations, Invoicing, Ledger & Portals.
 */

import { saveJsonToFile, loadJsonFromFile } from "../../lib/persistence/file-store.ts";
import type {
  BusinessOSData,
  ClientRelationship,
  OmnichannelInteraction,
  ClientProject,
  InvoiceRecord,
  ExpenseRecord,
  LedgerEntryRecord,
  ClientPortalSession,
} from "./schema.ts";

const DB_FILENAME = "business-os.json";

const INITIAL_DB_DATA: BusinessOSData = {
  clients: {},
  interactions: {},
  projects: {},
  invoices: {},
  expenses: {},
  ledger: [],
  portals: {},
};

class BusinessOSStore {
  private data: BusinessOSData;

  constructor() {
    this.data = loadJsonFromFile<BusinessOSData>(DB_FILENAME, INITIAL_DB_DATA);
    // Ensure all dictionaries are initialized
    this.data.clients = this.data.clients || {};
    this.data.interactions = this.data.interactions || {};
    this.data.projects = this.data.projects || {};
    this.data.invoices = this.data.invoices || {};
    this.data.expenses = this.data.expenses || {};
    this.data.ledger = this.data.ledger || [];
    this.data.portals = this.data.portals || {};
  }

  private persist(): void {
    saveJsonToFile(DB_FILENAME, this.data);
  }

  // --- Clients & Relationships ---
  public getClient(id: string): ClientRelationship | undefined {
    return this.data.clients[id];
  }

  public getClientByToken(token: string): ClientRelationship | undefined {
    return Object.values(this.data.clients).find((c) => c.portalToken === token);
  }

  public listClients(): ClientRelationship[] {
    return Object.values(this.data.clients);
  }

  public saveClient(client: ClientRelationship): ClientRelationship {
    this.data.clients[client.id] = { ...client, updatedAt: new Date().toISOString() };
    this.persist();
    return this.data.clients[client.id];
  }

  // --- Omnichannel Interactions ---
  public getInteractionsForClient(clientId: string): OmnichannelInteraction[] {
    return this.data.interactions[clientId] || [];
  }

  public addInteraction(interaction: OmnichannelInteraction): OmnichannelInteraction {
    if (!this.data.interactions[interaction.clientId]) {
      this.data.interactions[interaction.clientId] = [];
    }
    this.data.interactions[interaction.clientId].push(interaction);
    
    // Update client last touchpoint
    const client = this.data.clients[interaction.clientId];
    if (client) {
      client.lastTouchpointDate = interaction.timestamp;
      this.saveClient(client);
    }

    this.persist();
    return interaction;
  }

  // --- Projects & Operations ---
  public getProject(id: string): ClientProject | undefined {
    return this.data.projects[id];
  }

  public getProjectByDeal(dealId: string): ClientProject | undefined {
    return Object.values(this.data.projects).find((p) => p.dealId === dealId);
  }

  public getProjectByToken(portalToken: string): ClientProject | undefined {
    return Object.values(this.data.projects).find((p) => p.portalToken === portalToken);
  }

  public listProjects(): ClientProject[] {
    return Object.values(this.data.projects);
  }

  public saveProject(project: ClientProject): ClientProject {
    this.data.projects[project.id] = { ...project, updatedAt: new Date().toISOString() };
    this.persist();
    return this.data.projects[project.id];
  }

  // --- Invoices & Payments ---
  public getInvoice(id: string): InvoiceRecord | undefined {
    return this.data.invoices[id];
  }

  public getInvoiceByNumber(invoiceNumber: string): InvoiceRecord | undefined {
    return Object.values(this.data.invoices).find((inv) => inv.invoiceNumber === invoiceNumber);
  }

  public listInvoices(clientId?: string): InvoiceRecord[] {
    const all = Object.values(this.data.invoices);
    if (clientId) {
      return all.filter((inv) => inv.clientId === clientId);
    }
    return all;
  }

  public saveInvoice(invoice: InvoiceRecord): InvoiceRecord {
    this.data.invoices[invoice.id] = { ...invoice, updatedAt: new Date().toISOString() };
    
    // Recalculate client open invoice count
    const client = this.data.clients[invoice.clientId];
    if (client) {
      const openInvs = this.listInvoices(client.id).filter(
        (i) => i.status === "issued" || i.status === "viewed" || i.status === "overdue"
      );
      client.openInvoiceCount = openInvs.length;
      this.saveClient(client);
    }

    this.persist();
    return this.data.invoices[invoice.id];
  }

  // --- Expenses & Ledger ---
  public getExpense(id: string): ExpenseRecord | undefined {
    return this.data.expenses[id];
  }

  public listExpenses(projectId?: string): ExpenseRecord[] {
    const all = Object.values(this.data.expenses);
    if (projectId) {
      return all.filter((e) => e.projectId === projectId);
    }
    return all;
  }

  public saveExpense(expense: ExpenseRecord): ExpenseRecord {
    this.data.expenses[expense.id] = expense;
    this.persist();
    return expense;
  }

  public addLedgerEntry(entry: LedgerEntryRecord): LedgerEntryRecord {
    this.data.ledger.push(entry);
    this.persist();
    return entry;
  }

  public getLedgerEntries(): LedgerEntryRecord[] {
    return [...this.data.ledger];
  }

  // --- Portals ---
  public getPortalSession(token: string): ClientPortalSession | undefined {
    return this.data.portals[token];
  }

  public savePortalSession(session: ClientPortalSession): ClientPortalSession {
    this.data.portals[session.token] = session;
    this.persist();
    return session;
  }

  // Debug & reset helper for test suites
  public __resetForTests(): void {
    this.data = JSON.parse(JSON.stringify(INITIAL_DB_DATA));
    this.persist();
  }
}

export const dbStore = new BusinessOSStore();
