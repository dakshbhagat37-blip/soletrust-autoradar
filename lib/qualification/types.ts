import type {
  QualificationScores,
  ScoreComponent,
} from "../types/qualification.ts";

export type QualificationContext = {
  requestedIndustry: string;
  requestedCity?: string;
  requestedCountry?: string;
  requestedServiceTrack?: string; // e.g. "creative+technical", "creative", "technical"
  minOverallScore?: number;
};

export type ServiceFitSignal = {
  id: string;
  label: string;
  points: number;
  type: "opportunity" | "readiness" | "neutral";
  evidenceText: string;
};

export type ServiceFitResult = {
  score: number;
  signals: ServiceFitSignal[];
  reasons: string[];
};

export type { QualificationScores, ScoreComponent };
