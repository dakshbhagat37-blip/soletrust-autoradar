/**
 * SoleTrust Business OS v5.0 — Contract-to-Delivery Operations Engine
 * Automatically transforms signed SOW Contracts into active Projects with
 * milestone deliverables, subtasks, resource capacity, and margin tracking.
 */

import { dbStore } from "../../server/db/store.ts";
import { getOrCreateClientRelationship } from "../relations/unified-inbox.ts";
import type { ContractDetails } from "../../lib/closing/contract-generator.ts";
import type {
  ClientProject,
  ProjectMilestone,
  ProjectDeliverable,
  ProjectTask,
  ProjectTimeLog,
  DeliverableStatus,
  CurrencyCode,
} from "../../server/db/schema.ts";

export interface SpawnProjectOptions {
  dealId: string;
  contract: ContractDetails;
  currency?: CurrencyCode;
  assignedTeam?: string[];
  startDate?: string;
}

/**
 * Spawns an active Client Project from a generated SOW Contract Agreement.
 * Zero disconnected tools: wires signed deal directly to execution!
 */
export function spawnProjectFromDeal(options: SpawnProjectOptions): ClientProject {
  const { dealId, contract, currency = "INR", assignedTeam = ["Lead Architect", "Senior Developer", "UI/UX Designer"] } = options;
  
  // 1. Ensure or link client relationship
  const client = getOrCreateClientRelationship({
    companyName: contract.clientLegalName,
    primaryContactName: contract.clientSignerName,
    primaryContactEmail: contract.providerEmail || "client@company.com",
    city: contract.clientAddress.split(",")[0] || "Global",
    dealId,
  });

  const projectId = `proj-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6)}`;
  const startDate = options.startDate || new Date().toISOString();

  // Parse total contract value to integer cents/paise
  const rawTotal = contract.totalAgreementValue.replace(/[^0-9.]/g, "");
  const totalValueCents = Math.round((parseFloat(rawTotal) || 100000) * 100);

  // 2. Generate Milestones from Contract
  const milestones: ProjectMilestone[] = contract.milestones.map((m, idx) => {
    const milestoneId = `mstone-${projectId}-${idx + 1}`;
    const rawMilestoneVal = m.paymentAmount.replace(/[^0-9.]/g, "");
    const allocatedValueCents = Math.round((parseFloat(rawMilestoneVal) || totalValueCents / contract.milestones.length) * 100);

    const deliverables: ProjectDeliverable[] = [
      {
        id: `deliv-${milestoneId}-1`,
        projectId,
        milestoneId,
        title: m.deliverable,
        description: m.description,
        status: idx === 0 ? "in_progress" : "draft",
      },
    ];

    const tasks: ProjectTask[] = [
      {
        id: `task-${milestoneId}-1`,
        projectId,
        milestoneId,
        title: `Architecture & Specification: ${m.phase}`,
        assignedTo: assignedTeam[0] || "Lead Architect",
        estimatedHours: Math.max(10, m.estimatedWeeks * 8),
        loggedHours: 0,
        completed: false,
        priority: "high",
        dueDate: new Date(Date.now() + m.estimatedWeeks * 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: `task-${milestoneId}-2`,
        projectId,
        milestoneId,
        title: `Implementation & QA: ${m.deliverable}`,
        assignedTo: assignedTeam[1] || "Senior Developer",
        estimatedHours: Math.max(15, m.estimatedWeeks * 12),
        loggedHours: 0,
        completed: false,
        priority: "medium",
        dueDate: new Date(Date.now() + m.estimatedWeeks * 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    return {
      id: milestoneId,
      projectId,
      phaseNumber: idx + 1,
      title: m.phase,
      description: m.description,
      allocatedValueCents,
      estimatedWeeks: m.estimatedWeeks,
      startDate: new Date(Date.now() + idx * 14 * 24 * 60 * 60 * 1000).toISOString(),
      targetDate: new Date(Date.now() + (idx + 1) * m.estimatedWeeks * 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: idx === 0 ? "in_progress" : "pending",
      deliverables,
      tasks,
      invoiced: false,
    };
  });

  const totalDurationWeeks = contract.milestones.reduce((acc, m) => acc + m.estimatedWeeks, 0);
  const targetEndDate = new Date(Date.now() + totalDurationWeeks * 7 * 24 * 60 * 60 * 1000).toISOString();

  const project: ClientProject = {
    id: projectId,
    dealId,
    clientId: client.id,
    clientLegalName: contract.clientLegalName,
    contractAgreementNumber: contract.agreementNumber,
    projectName: `${contract.clientLegalName} — Full Solution Implementation`,
    scopeSummary: contract.scopeOfWork || [],
    totalContractValueCents: totalValueCents,
    currency,
    startDate,
    targetEndDate,
    status: "active",
    progressPercent: 0,
    milestones,
    timeLogs: [],
    allocatedTeam: assignedTeam,
    portalToken: client.portalToken,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  dbStore.saveProject(project);

  // Link active project to client
  client.activeProjectId = projectId;
  dbStore.saveClient(client);

  return project;
}

/**
 * Logs billable/internal time spent by a team member on a project task.
 */
export function logProjectTime(params: {
  projectId: string;
  taskId: string;
  memberEmail: string;
  memberName: string;
  hours: number;
  hourlyRateCents?: number;
  description: string;
  billable?: boolean;
}): ProjectTimeLog {
  const project = dbStore.getProject(params.projectId);
  if (!project) throw new Error(`Project ${params.projectId} not found`);

  const timeLog: ProjectTimeLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    projectId: params.projectId,
    taskId: params.taskId,
    memberEmail: params.memberEmail,
    memberName: params.memberName,
    hours: params.hours,
    hourlyRateCents: params.hourlyRateCents || 5000, // Default $50/hr or equivalent
    date: new Date().toISOString(),
    description: params.description,
    billable: params.billable ?? true,
  };

  project.timeLogs.push(timeLog);

  // Update logged hours on task
  for (const m of project.milestones) {
    const task = m.tasks.find((t) => t.id === params.taskId);
    if (task) {
      task.loggedHours += params.hours;
      break;
    }
  }

  dbStore.saveProject(project);
  return timeLog;
}

/**
 * Updates a deliverable's review status (e.g. In Progress ➔ Client Review ➔ Approved).
 */
export function updateDeliverableStatus(
  projectId: string,
  deliverableId: string,
  status: DeliverableStatus,
  options: { approvedBy?: string; feedback?: string; artifactUrl?: string } = {}
): ProjectDeliverable {
  const project = dbStore.getProject(projectId);
  if (!project) throw new Error(`Project ${projectId} not found`);

  let targetDeliverable: ProjectDeliverable | undefined;

  for (const m of project.milestones) {
    const d = m.deliverables.find((item) => item.id === deliverableId);
    if (d) {
      d.status = status;
      if (options.artifactUrl) d.artifactUrl = options.artifactUrl;
      if (options.feedback) d.clientFeedback = options.feedback;
      if (status === "approved") {
        d.approvedBy = options.approvedBy || "Client Representative";
        d.approvedAt = new Date().toISOString();
      }
      targetDeliverable = d;
      break;
    }
  }

  if (!targetDeliverable) throw new Error(`Deliverable ${deliverableId} not found`);

  // Recalculate project progress
  let totalDelivs = 0;
  let approvedDelivs = 0;
  for (const m of project.milestones) {
    for (const d of m.deliverables) {
      totalDelivs++;
      if (d.status === "approved") approvedDelivs++;
    }
  }

  project.progressPercent = totalDelivs > 0 ? Math.round((approvedDelivs / totalDelivs) * 100) : 0;
  if (project.progressPercent === 100) {
    project.status = "completed";
  }

  dbStore.saveProject(project);
  return targetDeliverable;
}

/**
 * Calculates Project Profit Margin & Capacity Metrics
 * UNKNOWN > WRONG: integer precision on cost vs. revenue.
 */
export function calculateProjectProfitability(projectId: string) {
  const project = dbStore.getProject(projectId);
  if (!project) throw new Error(`Project ${projectId} not found`);

  const totalRevenueCents = project.totalContractValueCents;
  
  // Calculate total labor cost
  const totalLaborCostCents = project.timeLogs.reduce((acc, log) => {
    return acc + Math.round(log.hours * log.hourlyRateCents);
  }, 0);

  // Fetch directly assigned project expenses
  const projectExpenses = dbStore.listExpenses(projectId);
  const totalExpenseCents = projectExpenses.reduce((acc, exp) => acc + exp.amountCents, 0);

  const totalCostCents = totalLaborCostCents + totalExpenseCents;
  const grossProfitCents = totalRevenueCents - totalCostCents;
  const grossMarginPercent = totalRevenueCents > 0
    ? Math.round((grossProfitCents / totalRevenueCents) * 1000) / 10
    : 0;

  return {
    projectId,
    projectName: project.projectName,
    totalRevenueCents,
    totalLaborCostCents,
    totalExpenseCents,
    totalCostCents,
    grossProfitCents,
    grossMarginPercent,
    loggedHours: project.timeLogs.reduce((acc, l) => acc + l.hours, 0),
    isHealthyMargin: grossMarginPercent >= 50,
  };
}

/**
 * Calculates Team Workload Capacity & Utilization (0 - 100%)
 */
export function getTeamCapacityMetrics() {
  const projects = dbStore.listProjects().filter((p) => p.status === "active" || p.status === "in_review");
  
  let totalEstimatedHours = 0;
  let totalLoggedHours = 0;

  for (const p of projects) {
    for (const m of p.milestones) {
      for (const t of m.tasks) {
        if (!t.completed) {
          totalEstimatedHours += t.estimatedHours;
        }
        totalLoggedHours += t.loggedHours;
      }
    }
  }

  // Baseline standard capacity: 40 hrs/week * 4 team members = 160 hrs/week
  const standardMonthlyCapacityHours = 640;
  const utilizationPercent = Math.min(
    100,
    Math.round((totalEstimatedHours / standardMonthlyCapacityHours) * 100)
  );

  return {
    activeProjectCount: projects.length,
    totalPendingWorkHours: totalEstimatedHours,
    totalLoggedHours,
    utilizationPercent,
    isOverloaded: utilizationPercent >= 90, // Policy trigger: throttle outbound prospecting
  };
}
