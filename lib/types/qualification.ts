export type ScoreComponent = {
  score: number;
  weight: number;
  reasons: string[];
  passed: boolean;
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
};

