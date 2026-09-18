export type QualificationContext = {
  requestedServiceTrack: string;
  requestedIndustry: string;
};

export type QualificationResult = {
  score: number;
  status: "new" | "qualified";
  reasons: string[];
};

export const QUALIFIED_MIN_SCORE = 60;
