import {
  scoreBusinessFit,
  scoreDiscoveryQuality,
  scoreIcpFit,
  scoreNeedSignal,
  scoreReachability,
} from "./rules";
import type { DiscoveredCompany } from "@/lib/discovery/types";
import {
  QUALIFIED_MIN_SCORE,
  type QualificationContext,
  type QualificationResult,
} from "./types";

export type { QualificationContext, QualificationResult } from "./types";
export { QUALIFIED_MIN_SCORE } from "./types";

export function qualifyCompany(
  company: DiscoveredCompany,
  context: QualificationContext,
): QualificationResult {
  const parts = [
    scoreIcpFit(company, context),
    scoreBusinessFit(company),
    scoreDiscoveryQuality(company),
    scoreNeedSignal(company),
    scoreReachability(company),
  ];

  const score = Math.min(
    100,
    Math.max(
      0,
      parts.reduce((sum, part) => sum + part.points, 0),
    ),
  );
  const reasons = parts.flatMap((part) => part.reasons);

  return {
    score,
    status: score >= QUALIFIED_MIN_SCORE ? "qualified" : "new",
    reasons,
  };
}
