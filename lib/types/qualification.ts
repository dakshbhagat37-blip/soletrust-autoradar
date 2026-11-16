export type ScoreComponent = {
  score: number;
  weight: number;
  reasons: string[];
  passed: boolean;
};

export type TargetDecisionMakerApproach = {
  fullName?: string | null;
  roleLabel?: string | null;
  authorityType?: string | null;
  approachRationale: string;
};

export type OpportunityIntelligence = {
  suitabilityRationale: string;
  recommendedServices: string[];
  supportingEvidence: string[];
  targetDecisionMaker: TargetDecisionMakerApproach | null;
  unknownFields: string[];
  serviceFitScore: number;
};

export type QualificationScores = {
  identityScore: number;
  industryScore: number;
  locationScore: number;
  contactabilityScore: number;
  decisionMakerScore: number;
  serviceFitScore: number;
  overallScore: number;
  isQualified: boolean;
  status: "new" | "qualified" | "review" | "rejected";
  reasons: string[];
  gateFailures: string[];
  explanation: string;
  opportunity?: OpportunityIntelligence | null;
};

